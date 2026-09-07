import pool from "../db/index.js";
import pino from "pino";
const logger = pino();
import type { UUID } from "node:crypto";



export async function createAssignmentService(classroom_id: UUID, course_id: UUID, teacher_id: UUID, title: string, description: string, due_date: Date) {

    const checkClassroomQuery = {
        text: 'SELECT 1 FROM classrooms WHERE id = $1',
        values: [classroom_id],
    }

    const checkTeacherQuery = {
        text: 'SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2',
        values: [classroom_id, teacher_id],
    }

    const checkCourseQuery = {
        text: 'SELECT 1 FROM courses WHERE id = $1 AND teacher_id = $2',
        values: [course_id, teacher_id],
    }

    const createAssignmentQuery = {
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
        text: 'SELECT 1 FROM assignments WHERE id = $1 AND created_by = $2',
        values: [assignment_id, teacher_id],
    }

    const createQuestionQuery = {
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
        text: 'SELECT classroom_id FROM assignments WHERE id = $1',
        values: [assignment_id],
    }

    const getQuestionsQuery = {
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

export async function submitQuestionService(
    user_id: UUID,
    question_id: UUID,
    answer: string,
) {
    try {

        // get the assignment id from the questions table // also checks if question exists
        const checkQuestionQuery = {
            text: 'SELECT assignment_id FROM questions WHERE id = $1',
            values: [question_id],
        }
        const resCheckQuestion = await pool.query(checkQuestionQuery)
        if (resCheckQuestion.rows.length === 0) {
            logger.error({ "question_id": question_id }, "Question does not exist")
            throw new Error("Question not found");
        }

        const assignment_id = resCheckQuestion.rows[0].assignment_id

        // fetch the classroom id from the assignments table
        const checkAssignmentQuery = {
            text: 'SELECT classroom_id FROM assignments WHERE id = $1',
            values: [assignment_id],
        }
        const resCheckAssignment = await pool.query(checkAssignmentQuery)
        if (resCheckAssignment.rows.length === 0) {
            logger.error({ "assignment_id": assignment_id }, "Assignment does not exist")
            throw new Error("Assignment not found");
        }

        const classroom_id = resCheckAssignment.rows[0].classroom_id


        const checkMembershipQuery = {
            text: 'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
            values: [classroom_id, user_id],
        }

        const resCheckMembership = await pool.query(checkMembershipQuery)
        if (resCheckMembership.rows.length === 0) {
            logger.error({ "user_id": user_id, "classroom_id": classroom_id }, "User is not a member of this classroom")
            throw new Error("You are not a member of this classroom");
        }

        // check if the question is already submitted
        const checkSubmissionQuery = {
            text: 'SELECT 1 FROM submissions WHERE question_id = $1 AND student_id = $2',
            values: [question_id, user_id],
        }
        const resCheckSubmission = await pool.query(checkSubmissionQuery)
        if (resCheckSubmission.rows.length > 0) {
            logger.error({ "question_id": question_id, "student_id": user_id }, "Question is already submitted")
            throw new Error("Question is already submitted");
        }

        // check if the submission is late
        const checkDeadlineQuery = {
            text: 'SELECT deadline FROM assignments WHERE id = $1',
            values: [assignment_id],
        }
        const resCheckDeadline = await pool.query(checkDeadlineQuery)
        if (resCheckDeadline.rows.length === 0) {
            logger.error({ "assignment_id": assignment_id }, "Assignment does not exist")
            throw new Error("Assignment not found");
        }

        const deadline = resCheckDeadline.rows[0].deadline

        const isLate = deadline < new Date()

        if (isLate) {
            // deadline has passed — record a zero-scored submission, discard the answer
            logger.warn({ "question_id": question_id, "student_id": user_id }, "Submission rejected — deadline has passed")
            throw new Error("Deadline has passed, submission not allowed");
        }

        // insert the on-time submission
        const insertSubmissionQuery = {
            text: 'INSERT INTO submissions(question_id, student_id, answer, is_late) VALUES($1, $2, $3, $4)',
            values: [question_id, user_id, answer, false],
        }

        await pool.query(insertSubmissionQuery)
        logger.info({ "question_id": question_id, "student_id": user_id, "answer": answer }, "Question submitted successfully")
        return {
            question_id,
            student_id: user_id,
            answer,
            is_late: false,
        }



    } catch (err) {
        if (err instanceof Error) {
            logger.error({ "error": err.message }, "Error while submitting question")
            throw err // re-throw with original message intact
        }
        logger.error({ "error": err }, "Unexpected error while submitting question")
        throw new Error("Error while submitting question")
    }
}


export async function getAssignmentSubmissionsService(user_id: UUID, assignment_id: UUID) {

    const getQuestionsQuery = {
        text: `SELECT q.id AS question_id, s.student_id, s.answer, s.score, s.feedback, s.grading_status, s.graded_at, s.is_late
                FROM questions q
                LEFT JOIN submissions s ON s.question_id = q.id AND s.student_id = $2
                WHERE q.assignment_id = $1`,
        values: [assignment_id, user_id],
    }

    try {
        const checkAssignmentQuery = {
            text: 'SELECT classroom_id FROM assignments WHERE id = $1',
            values: [assignment_id],
        }
        const resCheckAssignment = await pool.query(checkAssignmentQuery)
        if (resCheckAssignment.rows.length === 0) {
            logger.error({ "assignment_id": assignment_id }, "Assignment does not exist")
            throw new Error("Assignment not found");
        }

        const classroom_id = resCheckAssignment.rows[0].classroom_id

        const checkMembershipQuery = {
            text: `SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2
                    UNION
                    SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2`,
            values: [classroom_id, user_id],
        }

        const resCheckMembership = await pool.query(checkMembershipQuery)
        if (resCheckMembership.rows.length === 0) {
            logger.error({ "user_id": user_id, "classroom_id": classroom_id }, "User is not a member of this classroom")
            throw new Error("You are not a member of this classroom");
        }
    } catch (err) {
        logger.error({ "error": err }, "Error while checking membership")
        throw new Error("Error while checking membership")
    }

    try {
        const resGetQuestions = await pool.query(getQuestionsQuery)
        const questions = resGetQuestions.rows
        return questions
    } catch (err) {
        logger.error({ "error": err, "query": getQuestionsQuery }, "Error while getting assignment submissions")
        throw new Error("Error while getting assignment submissions")
    }
}


export async function gradeSubmissionService(user_id: UUID, submission_id: UUID, score: number, feedback?: string) {

    try {
        const checkSubmissionQuery = {
            text: 'SELECT * FROM submissions WHERE id = $1',
            values: [submission_id],
        }
        const resCheckSubmission = await pool.query(checkSubmissionQuery)
        if (resCheckSubmission.rows.length === 0) {
            logger.error({ "submission_id": submission_id }, "Submission does not exist")
            throw new Error("Submission not found");
        }

        const question_id = resCheckSubmission.rows[0].question_id

        const checkQuestionQuery = {
            text: 'SELECT assignment_id FROM questions WHERE id = $1',
            values: [question_id],
        }
        const resCheckQuestion = await pool.query(checkQuestionQuery)
        if (resCheckQuestion.rows.length === 0) {
            logger.error({ "question_id": question_id }, "Question does not exist")
            throw new Error("Question not found");
        }

        const assignment_id = resCheckQuestion.rows[0].assignment_id

        const checkAssignmentQuery = {
            text: 'SELECT classroom_id FROM assignments WHERE id = $1',
            values: [assignment_id],
        }

        const resCheckAssignment = await pool.query(checkAssignmentQuery)
        if (resCheckAssignment.rows.length === 0) {
            logger.error({ "assignment_id": assignment_id }, "Assignment does not exist")
            throw new Error("Assignment not found");
        }

        const classroom_id = resCheckAssignment.rows[0].classroom_id

        const checkMembershipQuery = {
            text: 'SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2',
            values: [classroom_id, user_id],
        }

        const resCheckMembership = await pool.query(checkMembershipQuery)
        if (resCheckMembership.rows.length === 0) {
            logger.error({ "user_id": user_id, "classroom_id": classroom_id }, "User is not a teacher of this classroom")
            throw new Error("You are not a teacher of this classroom");
        }

        const updateSubmissionQuery = {
            text: 'UPDATE submissions SET score = $1, feedback = $2, graded_at = current_timestamp, grading_status = $4 WHERE id = $3',
            values: [score, feedback, submission_id, 'graded'],
        }

        const resUpdateSubmission = await pool.query(updateSubmissionQuery)
        if (resUpdateSubmission.rowCount === 0) {
            logger.error({ "submission_id": submission_id }, "Submission does not exist")
            throw new Error("Submission not found");
        }

        logger.info({ "submission_id": submission_id, "score": score, "feedback": feedback }, "Submission graded successfully")
        return {
            submission_id,
            score,
            feedback,
        }

    } catch (err) {
        if (err instanceof Error) {
            logger.error({ "error": err.message }, "Error while grading submission")
            throw err
        }
        logger.error({ "error": err }, "Unexpected error while grading submission")
        throw new Error("Error while grading submission")
    }
}

export async function publishDraftService(user_id: UUID, assignment_id: UUID) {

    try {
        const checkAssignmentQuery = {
            text: 'SELECT classroom_id FROM assignments WHERE id = $1',
            values: [assignment_id],
        }
        const resCheckAssignment = await pool.query(checkAssignmentQuery)
        if (resCheckAssignment.rows.length === 0) {
            logger.error({ "assignment_id": assignment_id }, "Assignment does not exist")
            throw new Error("Assignment not found");
        }

        const classroom_id = resCheckAssignment.rows[0].classroom_id

        const checkMembershipQuery = {
            text: 'SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2',
            values: [classroom_id, user_id],
        }

        const resCheckMembership = await pool.query(checkMembershipQuery)
        if (resCheckMembership.rows.length === 0) {
            logger.error({ "user_id": user_id, "classroom_id": classroom_id }, "User is not a teacher of this classroom")
            throw new Error("You are not a teacher of this classroom");
        }

        const updateAssignmentQuery = {
            text: 'UPDATE assignments SET is_published = $1 WHERE id = $2',
            values: [true, assignment_id],
        }

        const resUpdateAssignment = await pool.query(updateAssignmentQuery)
        if (resUpdateAssignment.rowCount === 0) {
            logger.error({ "assignment_id": assignment_id }, "Assignment does not exist")
            throw new Error("Assignment not found");
        }

        logger.info({ "assignment_id": assignment_id, "user_id": user_id }, "Assignment published successfully")
        return {
            assignment_id,
            user_id,
        }

    } catch (err) {
        if (err instanceof Error) {
            logger.error({ "error": err.message }, "Error while publishing assignment")
            throw err
        }
        logger.error({ "error": err }, "Unexpected error while publishing assignment")
        throw new Error("Error while publishing assignment")
    }
}