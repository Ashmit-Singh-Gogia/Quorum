import { createAssignmentService, getAssignmentsService } from "./assignments.service.js";
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