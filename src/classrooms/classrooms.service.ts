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
            text: 'INSERT INTO classroom_teachers(classroom_id, teacher_id, standing) VALUES($1, $2, $3) RETURNING id',
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
            text: 'INSERT INTO classroom_teachers(classroom_id, teacher_id, standing) VALUES($1, $2, $3) RETURNING id',
            values: [classroom_id, coTeacherId, 'co_teacher'],
        }
        const res2 = await pool.query(createClassRoomTeacherQuery)
        logger.info({ "classroomId": classroom_id, "coTeacherId": coTeacherId }, "Co-teacher added successfully")
        return res2.rows[0].id
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
        text: 'SELECT classroom_id FROM classroom_teachers WHERE teacher_id = $1 UNION ALL SELECT classroom_id FROM classroom_students WHERE student_id = $1',
        values: [user_id],
    }
    const res = await pool.query(getClassroomsQuery)
    return res.rows
}