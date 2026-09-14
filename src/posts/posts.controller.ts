import { createPostService, getPostsService, togglePinnedPostService } from "./posts.service.js";
import type { Request, Response } from "express";
import pino from "pino";
import type { UUID } from "node:crypto";
const logger = pino();

export async function createPost(req: Request, res: Response) {
    try {
        const { course_id, type, title, body } = req.body as {
            course_id: UUID | null,
            type: string,
            title: string,
            body: string,
        }
        const classroom_id: UUID = (req as any).params.id
        const author_id: UUID = (req as any).user.userId
        const result = await createPostService(author_id, classroom_id, course_id ?? null, type, title, body)
        res.status(201).json(result)
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: "Error while creating post" })
    }
}

export async function getPosts(req: Request, res: Response) {
    try {
        const course_id = (req.query.course_id as string | undefined) ?? null
        const classroom_id: UUID = (req as any).params.id
        const result = await getPostsService(classroom_id, course_id as UUID | null)
        res.status(200).json(result)
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: "Error while fetching posts" })
    }
}

export async function togglePinnedPost(req: Request, res: Response) {
    try {
        const { post_id } = req.body as { post_id: UUID }
        const classroom_id: UUID = (req as any).params.id
        const result = await togglePinnedPostService(post_id, classroom_id)
        res.status(200).json(result)
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: "Error while toggling pinned post" })
    }
}