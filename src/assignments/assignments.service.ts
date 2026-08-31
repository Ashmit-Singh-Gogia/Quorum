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

export async function createQuestionService(
    assignment_id: UUID,
    teacher_id: UUID,
    type: "mcq" | "text" | "github_link",
    prompt: string,
    marks: number,
    options?: any,  // only for mcq
    correct_answer?: string, // only for mcq
    is_required: boolean = true
) {
    // Check if the assignment exists and also created by the same teacher
    const checkAssignmentQuery = {
        name: 'check-assignment-owner',
        text: 'SELECT 1 FROM assignments WHERE id = $1 AND created_by = $2',
        values: [assignment_id, teacher_id],
    }

    const createQuestionQuery = {
        name: 'create-question',
        text: 'INSERT INTO questions(assignment_id, type, prompt, marks, options, correct_answer, is_required) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        values: [assignment_id, type, prompt, marks, options ? JSON.stringify(options) : null, correct_answer, is_required],
    }

    try {
        const resCheckAssignment = await pool.query(checkAssignmentQuery)
        if (resCheckAssignment.rows.length === 0) {
            logger.error({ "assignment_id": assignment_id, "teacher_id": teacher_id }, "Assignment does not exist or teacher does not have permission")
            throw new Error("Assignment not found or you do not have permission to modify it");
        }

        const res = await pool.query(createQuestionQuery)
        const questionId = res.rows[0].id
        logger.info({ "questionId": questionId, "assignment_id": assignment_id }, "Question created successfully")
        return { questionId, assignment_id }
    } catch (err) {
        logger.error({ "error": err, "query": createQuestionQuery }, "Error while creating question")
        throw new Error("Error while creating question")
    }
}

export async function getQuestionsService(user_id: UUID, role: "student" | "teacher" | "site_admin", assignment_id: UUID) {
    // extract the classroom id using assignment id 
    // then check if the user is a member of the classroom using union on both student and teachers
    const checkAssignmentQuery = {
        name: 'check-assignment',
        text: 'SELECT classroom_id FROM assignments WHERE id = $1',
        values: [assignment_id],
    }

    const getQuestionsQuery = {
        name: 'get-questions',
        text: 'SELECT * FROM questions WHERE assignment_id = $1',
        values: [assignment_id],
    }

    try {
        const resCheckAssignment = await pool.query(checkAssignmentQuery)
        if (resCheckAssignment.rows.length === 0) {
            logger.error({ "assignment_id": assignment_id }, "Assignment does not exist")
            throw new Error("Assignment not found");
        }
        const classroom_id = resCheckAssignment.rows[0].classroom_id

        const checkMembershipQuery = {
            name: 'check-membership',
            text: 'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2 UNION SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2',
            values: [classroom_id, user_id],
        }

        const resCheckMembership = await pool.query(checkMembershipQuery)
        if (resCheckMembership.rows.length === 0) {
            logger.error({ "user_id": user_id, "classroom_id": classroom_id }, "User is not a member of this classroom")
            throw new Error("You are not a member of this classroom");
        }
        const res = await pool.query(getQuestionsQuery)
        
        if (role === "student") {
            return res.rows.map(question => {
                const { correct_answer, ...rest } = question;
                return rest;
            });
        }

        return res.rows
    } catch (err) {
        logger.error({ "error": err, "query": getQuestionsQuery }, "Error while getting questions")
        throw new Error("Error while getting questions")
    }
}