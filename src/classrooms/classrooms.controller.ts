import { type Request, type Response } from "express";
import { createClassroomService, addCoTeacherService, regenerateJoinCodeService, getClassroomsService } from "./classrooms.service.js"
import pino from "pino";
import type { UUID } from "node:crypto";
const logger = pino();


export async function createClassRoom(req: Request, res: Response): Promise<void> {
    try {
        const { name } = req.body
        const teacherId = (req as any).user.userId
        const classroomId = await createClassroomService(name, teacherId)
        res.status(201).json({ classroomId })
    } catch (err) {
        const message = (err as Error).message;
        if (message === "classroom name is not Valid") {
            res.status(400).json({ error: message });
        } else {
            logger.error({ error: err }, "Error creating classroom");
            res.status(500).json({ error: "Error while creating classroom" });
        }
    }
}

export async function addCoTeacher(req: Request, res: Response): Promise<void> {
    try {
        const classroom_id: UUID = req.params.id as UUID
        const { coTeacherId } = req.body
        const id = await addCoTeacherService(classroom_id, coTeacherId)
        res.status(201).json({ id })
    } catch (err) {
        const message = (err as Error).message;
        if (message === "classroom does not exist") {
            logger.error({ "classroomId": req.params.id }, "classroom does not exist")
            res.status(400).json({ error: message });
        } else {
            logger.error({ error: err }, "Error adding co-teacher");
            res.status(500).json({ error: "Error while adding co-teacher" });
        }
    }
}

export async function regenerateJoinCode(req: Request, res: Response): Promise<void> {
    try {
        const classroom_id: UUID = req.params.id as UUID
        const joinCode = await regenerateJoinCodeService(classroom_id)
        res.status(200).json({ joinCode })
    } catch (err) {
        const message = (err as Error).message;
        if (message === "classroom does not exist") {
            logger.error({ "classroomId": req.params.id }, "classroom does not exist")
            res.status(400).json({ error: message });
        } else {
            logger.error({ error: err }, "Error regenerating join code");
            res.status(500).json({ error: "Error while regenerating join code" });
        }
    }
}

export async function getClassrooms(req: Request, res: Response): Promise<void> {
    try {
        const userId: UUID = (req as any).user.userId
        const classrooms = await getClassroomsService(userId)
        res.status(200).json({ classrooms })
    } catch (err) {
        logger.error({ error: err }, "Error getting classrooms");
        res.status(500).json({ error: "Error while getting classrooms" });
    }
}