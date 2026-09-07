import { createAssignmentService, getAssignmentsService, createQuestionService, getQuestionsService, submitQuestionService, getAssignmentSubmissionsService, gradeSubmissionService, publishDraftService } from "./assignments.service.js";
import type { Request, Response } from "express";
import pino from "pino";
import type { UUID } from "node:crypto";
const logger = pino();


export async function createAssignmentController(req: Request, res: Response) {
    try {
        const { course_id, classroom_id, title, description, due_date } = req.body as {
            course_id: UUID,
            classroom_id: UUID,
            title: string,
            description: string,
            due_date: Date,
        }
        const teacher_id: UUID = (req as any).user.userId
        const result = await createAssignmentService(classroom_id, course_id, teacher_id, title, description, due_date)
        res.status(201).json(result)
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: "Error while creating assignment" })
    }
}

export async function getAssignments(req: Request, res: Response) {
    try {
        const { course_id, status } = req.query as {
            course_id?: UUID,
            status?: "active" | "past",
        }
        const classroom_id = req.params.id as UUID;
        const user_id: UUID = (req as any).user.userId
        const role: "student" | "teacher" | "site_admin" = (req as any).user.role
        const result = await getAssignmentsService(user_id, role, classroom_id, course_id, status)
        res.status(200).json(result)
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: "Error while getting assignments" })
    }
}

export async function createQuestion(req: Request, res: Response) {
    try {
        const { assignment_id, type, prompt, marks, options, correct_answer, is_required } = req.body as {
            assignment_id: UUID,
            type: "mcq" | "text" | "github_link",
            prompt: string,
            marks: number,
            options?: any,
            correct_answer?: string,
            is_required?: boolean,
        }
        const teacher_id: UUID = (req as any).user.userId
        const result = await createQuestionService(assignment_id, teacher_id, type, prompt, marks, options, correct_answer, is_required)
        res.status(201).json(result)
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: "Error while creating question" })
    }
}

export async function getQuestions(req: Request, res: Response) {
    try {
        const user_id: UUID = (req as any).user.userId
        const role: "student" | "teacher" | "site_admin" = (req as any).user.role
        const assignment_id = req.params.id as UUID
        const result = await getQuestionsService(user_id, role, assignment_id)
        res.status(200).json(result)
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: "Error while getting questions" })
    }
}


export async function submitQuestion(req: Request, res: Response) {
    try {
        const { question_id, answer } = req.body as {
            question_id: UUID,
            answer: string,
        }
        const student_id: UUID = (req as any).user.userId
        const result = await submitQuestionService(student_id, question_id, answer)
        return res.status(201).json(result)
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error while submitting question"
        logger.error(err)

        if (message === "Question not found" || message === "Assignment not found") {
            return res.status(404).json({ error: message })
        }
        if (message === "You are not a member of this classroom") {
            return res.status(403).json({ error: message })
        }
        if (message === "Question is already submitted") {
            return res.status(409).json({ error: message })
        }
        if (message === "Deadline has passed, submission not allowed") {
            return res.status(403).json({ error: message })
        }

        return res.status(500).json({ error: "Error while submitting question" })
    }
}

// Student (own) / Teacher (via ?student_id=)
export async function getAssignmentSubmissions(req: Request, res: Response) {
    try {
        const user_id: UUID = (req as any).user.userId
        const role: "student" | "teacher" | "site_admin" = (req as any).user.role
        let student_id: UUID | null = null
        if (role === "student") {
            // Student always sees their own — can't pass another ID
            student_id = user_id
        } else if (role === "teacher") {
            // Teacher must specify which student
            student_id = req.query.student_id as UUID
        }

        if (!student_id) {
            return res.status(400).json({ error: "student_id is required" })
        }

        const assignment_id = req.params.id as UUID
        const result = await getAssignmentSubmissionsService(student_id, assignment_id)
        return res.status(200).json(result)
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error while getting assignment submissions"
        logger.error(err)

        if (message === "Assignment not found") {
            return res.status(404).json({ error: message })
        }
        if (message === "You are not a member of this classroom") {
            return res.status(403).json({ error: message })
        }

        return res.status(500).json({ error: "Error while getting assignment submissions" })
    }
}

export async function gradeSubmission(req: Request, res: Response) {
    try {
        const { score, feedback } = req.body as {
            score: number,
            feedback?: string,
        }
        const submission_id = req.params.id as UUID
        const user_id: UUID = (req as any).user.userId
        const result = await gradeSubmissionService(user_id, submission_id, score, feedback)
        return res.status(200).json(result)
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error while grading submission"
        logger.error(err)

        if (message === "Submission not found") {
            return res.status(404).json({ error: message })
        }
        if (message === "You are not a member of this classroom") {
            return res.status(403).json({ error: message })
        }
        if (message === "Deadline has passed, submission not allowed") {
            return res.status(403).json({ error: message })
        }

        return res.status(500).json({ error: "Error while grading submission" })
    }
}

export async function publishDraft(req: Request, res: Response) {
    try {
        const assignment_id = req.params.id as UUID
        const user_id: UUID = (req as any).user.userId
        const result = await publishDraftService(user_id, assignment_id)
        return res.status(200).json(result)
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error while publishing assignment"
        logger.error(err)

        if (message === "Assignment not found") {
            return res.status(404).json({ error: message })
        }
        if (message === "You are not a member of this classroom") {
            return res.status(403).json({ error: message })
        }

        return res.status(500).json({ error: "Error while publishing assignment" })
    }
}
