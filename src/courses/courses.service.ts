import pool from '../db/index.js'
import pino from 'pino'
const logger = pino()
import type { UUID } from 'node:crypto'

export async function createCourseService(name: string, teacher_id: UUID, classroom_id: UUID) {
    const createCourseQuery = {
        name: 'create-course',
        text: 'INSERT INTO courses(name, teacher_id , classroom_id) VALUES($1, $2, $3) RETURNING id',
        values: [name, teacher_id, classroom_id],
    }
    const checkClassRoomQuery = {
        name: 'check-classroom',
        text: 'SELECT 1 FROM classrooms WHERE id = $1',
        values: [classroom_id],
    }
    try {
        const resCheck = await pool.query(checkClassRoomQuery)
        if (resCheck.rows.length === 0) {
            logger.error({ "classroom_id": classroom_id }, "classroom does not exist")
            throw new Error("classroom does not exist");
        }
        const res = await pool.query(createCourseQuery)
        const courseId = res.rows[0].id
        logger.info({ "courseId": courseId, "teacher_id": teacher_id, "classroom_id": classroom_id }, "Course created successfully")
        return courseId
    } catch (err) {
        logger.error({ "error": err, "query": createCourseQuery }, "Error while creating course")
        throw new Error("Error while creating course")
    }
}

export async function getCoursesService(classroom_id: UUID) {
    const getCourseQuery = {
        name: 'get-course',
        text: 'SELECT * FROM courses WHERE classroom_id = $1',
        values: [classroom_id],
    }
    try {
        const res = await pool.query(getCourseQuery)
        const course = res.rows
        logger.info({ "course": course, "classroom_id": classroom_id }, "Course fetched successfully")
        return course
    } catch (err) {
        logger.error({ "error": err, "query": getCourseQuery }, "Error while fetching course")
        throw new Error("Error while fetching course")
    }
}