import { type Request, type Response } from 'express';
import { createUser, login, findUserById } from "./auth.service.js";
import pino from "pino";
const logger = pino();

export async function signup(req: Request, res: Response): Promise<void> {
    const { name, email, password, global_role } = req.body;
    try {
        const user = await createUser(name, email, password, global_role);
        res.status(201).json({ user });
    } catch (err) {
        const message = (err as Error).message;
        if (message === "User already exists") {
            res.status(409).json({ error: message });
        } else {
            res.status(400).json({ error: message });
        }
    }
}

export async function loginController(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
        const user = await login(email, password);
        res.status(200).json({ user });
    } catch (err) {
        const message = (err as Error).message
        if (message === "Invalid Credentials") {
            res.status(401).json({ error: message });
        } else {
            res.status(400).json({ error: message });
        }
    }
}


export async function getMe(req: Request, res: Response): Promise<void> {
    const { userId } = (req as any).user
    try {
        const user = await findUserById(userId)
        if (!user) {
            logger.error("Error finding user");
            res.status(404).json({ error: "User not found" });
        } else {
            const { password_hash, ...safeUser } = user
            res.status(200).json({ user: safeUser });
        }
    } catch {
        logger.error("Error finding user");
        res.status(500).json({ error: "Internal DB error" });
    }
}