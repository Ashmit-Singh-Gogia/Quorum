import type { UUID } from "node:crypto";
import pool from '../db/index.js'
import { validateName } from "../auth/auth.validation.js";
import pino from "pino";
const logger = pino();

// helper method for generating random join code for classroom
function generateJoinCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}


export async function createClassroomService(name: string, teacherId: UUID) {
    const validationName: { error: Error | null; value: string } = validateName(name)
    if (validationName.error) {
        logger.error({ "classroomName": name }, "classroom name is not Valid")
        throw new Error("classroom name is not Valid");
    }

    name = validationName.value
    const joinCode = generateJoinCode()
    const createClassRoomQuery = {
        name: 'create-classroom',
        text: 'INSERT INTO classrooms(name,  join_code, created_by) VALUES($1, $2, $3) RETURNING id',
        values: [name, joinCode, teacherId],
    }

    try {
        await pool.query('BEGIN')

        const res = await pool.query(createClassRoomQuery)
        const classroomId = res.rows[0].id

        const createClassRoomTeacherQuery = {
            name: 'create-classroom-teacher',
            text: 'INSERT INTO classroom_teachers(classroom_id, teacher_id, standing) VALUES($1, $2, $3)',
            values: [classroomId, teacherId, 'owner'],
        }
        await pool.query(createClassRoomTeacherQuery)

        await pool.query('COMMIT')
        logger.info({ "classroomId": classroomId }, "Classroom created successfully")
        return classroomId
    } catch (error) {

        await pool.query('ROLLBACK')
        logger.error({ "error": error, "query": createClassRoomQuery }, "Error while creating classroom")
        throw new Error("Error while creating classroom")
    }
}

export async function addCoTeacherService(classroom_id: UUID, coTeacherId: UUID) {
    const checkClassRoomQuery = {
        name: 'check-classroom',
        text: 'SELECT 1 FROM classrooms WHERE id = $1',
        values: [classroom_id],
    }
    try {
        const res = await pool.query(checkClassRoomQuery)
        if (res.rows.length === 0) {
            logger.error({ "classroomId": classroom_id }, "classroom does not exist")
            throw new Error("classroom does not exist");
        }
        const createClassRoomTeacherQuery = {
            name: 'add-co-teacher',
            text: 'INSERT INTO classroom_teachers(classroom_id, teacher_id, standing) VALUES($1, $2, $3)',
            values: [classroom_id, coTeacherId, 'co_teacher'],
        }
        await pool.query(createClassRoomTeacherQuery)
        logger.info({ "classroomId": classroom_id, "coTeacherId": coTeacherId }, "Co-teacher added successfully")
        return { classroom_id, coTeacherId }
    } catch (err) {
        logger.error({ "error": err, "query": checkClassRoomQuery }, "Error while adding co-teacher")
        throw err
    }
}

export async function regenerateJoinCodeService(classroom_id: UUID) {
    const checkClassRoomQuery = {
        name: 'check-classroom',
        text: 'SELECT 1 FROM classrooms WHERE id = $1',
        values: [classroom_id],
    }
    try {
        const res = await pool.query(checkClassRoomQuery)
        if (res.rows.length === 0) {
            logger.error({ "classroomId": classroom_id }, "classroom does not exist")
            throw new Error("classroom does not exist");
        }

        const joinCode = generateJoinCode()

        const updateClassRoomQuery = {
            name: 'update-classroom',
            text: 'UPDATE classrooms SET join_code = $1 WHERE id = $2',
            values: [joinCode, classroom_id],
        }
        await pool.query(updateClassRoomQuery)
        logger.info({ "classroomId": classroom_id, "joinCode": joinCode }, "Join code regenerated successfully")
        return joinCode
    } catch (err) {
        logger.error({ "error": err, "query": checkClassRoomQuery }, "Error while regenerating join code")
        throw err
    }

}

export async function getClassroomsService(user_id: UUID) {
    const getClassroomsQuery = {
        name: 'get-classrooms',
        text: `SELECT c.*, ct.standing as role FROM classroom_teachers ct
        JOIN classrooms c ON c.id = ct.classroom_id
        WHERE ct.teacher_id = $1
        UNION ALL
        SELECT c.*, 'student' as role FROM classroom_students cs
        JOIN classrooms c ON c.id = cs.classroom_id
        WHERE cs.student_id = $1`,
        values: [user_id],
    }
    const res = await pool.query(getClassroomsQuery)
    return res.rows
}


// student joining service
export async function addStudentService(joinCode: string, userId: UUID) {

    logger.info({ "joinCode": joinCode, "userId": userId }, "Looking up classroom with join code")

    const queryClassroomWithJoinCode = {
        name: 'check-classrooms-with-joincode',
        text: 'SELECT id FROM classrooms WHERE join_code = $1',
        values: [joinCode],
    }
    try {
        const res = await pool.query(queryClassroomWithJoinCode)
        if (res.rows.length === 0) {
            logger.error({ "join_code": joinCode }, "no classroom exists with this join_code")
            throw new Error("no classroom exists with this join_code");
        }
        const classroomId = res.rows[0].id


        // Now we have a classroom this join code
        const queryInsertStudent = {
            name: 'insert-student',
            text: 'Insert INTO classroom_students(classroom_id , student_id) VALUES($1 , $2)',
            values: [classroomId, userId],
        }
        await pool.query(queryInsertStudent)
        logger.info({ "classroomId": classroomId, "studentId": userId }, "student added successfully")
        return { classroomId, userId }
    } catch (err) {
        logger.error({ "error": err, "query": queryClassroomWithJoinCode }, "error while using join_code")
        throw err
    }
}

export async function getMembersService(classroom_id: UUID) {
    const queryGetMembers = {
        name: 'get-members',
        text: `SELECT ct.teacher_id AS user_id, u.name, ct.standing AS role
               FROM classroom_teachers ct
               JOIN users u ON u.id = ct.teacher_id
               WHERE ct.classroom_id = $1
               UNION ALL
               SELECT cs.student_id AS user_id, u.name, 'student' AS role
               FROM classroom_students cs
               JOIN users u ON u.id = cs.student_id
               WHERE cs.classroom_id = $1`,
        values: [classroom_id],
    }
    const res = await pool.query(queryGetMembers)
    return res.rows
}