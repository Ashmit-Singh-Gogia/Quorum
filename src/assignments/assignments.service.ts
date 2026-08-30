import pool from "../db/index.js";
import pino from "pino";
const logger = pino();
import type { UUID } from "node:crypto";



export async function createAssignmentService(classroom_id: UUID, course_id: UUID, teacher_id: UUID, title: string, description: string, due_date: Date) {

    const checkClassroomQuery = {
        name: 'check-classroom',
        text: 'SELECT 1 FROM classrooms WHERE id = $1',
        values: [classroom_id],
    }

    const checkTeacherQuery = {
        name: 'check-teacher',
        text: 'SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2',
        values: [classroom_id, teacher_id],
    }

    const checkCourseQuery = {
        name: 'check-course',
        text: 'SELECT 1 FROM courses WHERE id = $1 AND teacher_id = $2',
        values: [course_id, teacher_id],
    }

    const createAssignmentQuery = {
        name: 'create-assignment',
        text: 'INSERT INTO assignments(course_id, classroom_id, title, description, deadline, created_by) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
        values: [course_id, classroom_id, title, description, due_date, teacher_id],
    }

    try {
        const resCheckClassroom = await pool.query(checkClassroomQuery)
        if (resCheckClassroom.rows.length === 0) {
            logger.error({ "classroom_id": classroom_id }, "classroom does not exist")
            throw new Error("classroom does not exist");
        }
        const resCheckTeacher = await pool.query(checkTeacherQuery)
        if (resCheckTeacher.rows.length === 0) {
            logger.error({ "classroom_id": classroom_id, "teacher_id": teacher_id }, "teacher is not a teacher of this classroom")
            throw new Error("teacher is not a teacher of this classroom");
        }
        const resCheckCourse = await pool.query(checkCourseQuery)
        if (resCheckCourse.rows.length === 0) {
            logger.error({ "course_id": course_id, "teacher_id": teacher_id }, "teacher does not own this course")
            throw new Error("teacher does not own this course");
        }
        const res = await pool.query(createAssignmentQuery)
        const assignmentId = res.rows[0].id
        logger.info({ "assignmentId": assignmentId, "course_id": course_id, "teacher_id": teacher_id, "classroom_id": classroom_id }, "Assignment created successfully")
        return { assignmentId, course_id }
    } catch (err) {
        logger.error({ "error": err, "query": createAssignmentQuery }, "Error while creating assignment")
        throw new Error("Error while creating assignment")
    }

}

export async function getAssignmentsService(
    user_id: UUID,
    role: "student" | "teacher" | "site_admin",
    classroom_id?: UUID,
    course_id?: UUID,
    status?: "active" | "past"
) {
    try {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // 1. Classroom filter
        if (classroom_id) {
            conditions.push(`classroom_id = $${paramIndex++}`);
            values.push(classroom_id);
        }

        // 2. Course filter
        if (course_id) {
            conditions.push(`course_id = $${paramIndex++}`);
            values.push(course_id);
        }

        // 3. Teacher-only
        if (role === "teacher" && !classroom_id && !course_id) {
            conditions.push(`created_by = $${paramIndex++}`);
            values.push(user_id);
        }

        // 4. Deadline (active vs past)
        if (status === "active") {
            conditions.push(`deadline > now()`);
        } else if (status === "past") {
            conditions.push(`deadline <= now()`);
        }

        // 5. Students only see published assignments
        if (role === "student") {
            conditions.push(`is_published = true`);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const query = {
            text: `SELECT * FROM assignments ${whereClause} ORDER BY deadline ASC`,
            values,
        };

        const res = await pool.query(query);
        return res.rows;
    } catch (err) {
        logger.error({ "error": err }, "Error while getting assignments");
        throw new Error("Error while getting assignments");
    }
}
