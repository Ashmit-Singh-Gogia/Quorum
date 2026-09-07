import type { Request, Response } from "express";
import type { UUID } from "node:crypto";
import pino from "pino";
const logger = pino();
import { createCourseService, getCoursesService } from "./courses.service.js";


export async function createCourse(req: Request, res: Response) {
    try {
        const { name } = req.body as { name: string }
        const teacherId: UUID = (req as any).user.userId
        const classroom_id: UUID = req.params.id as UUID
        const courseId = await createCourseService(name, teacherId, classroom_id)
        res.status(201).json({ courseId })
    } catch (err) {
        logger.error({ error: err }, "Error creating course");
        res.status(500).json({ error: "Error while creating course" });
    }
}

export async function getCourses(req: Request, res: Response) {
    try {
        const classroom_id: UUID = req.params.id as UUID
        const course = await getCoursesService(classroom_id)
        res.status(200).json(course)
    } catch (err) {
        logger.error({ error: err }, "Error fetching course");
        res.status(500).json({ error: "Error while fetching course" });
    }
}