import type { Request, Response, NextFunction } from 'express';
import pool from '../db/index.js'
import { verifyToken } from './auth.service.js'
import type { UUID } from 'node:crypto';

export function authenticate(req: Request, res: Response, next: NextFunction) {

    const authHeader = req.get('authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Invalid token format' });
    }
    const token: string = authHeader.split(' ')[1] ?? '';

    try {
        let userDetail: { userId: string, role: string } | null = verifyToken(token)
        if (!userDetail) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        (req as any).user = userDetail;
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }

};

export function authorize(...authRoles: ("student" | "site_admin" | "teacher")[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const role: "student" | "site_admin" | "teacher" = (req as any).user.role;

        for (let i = 0; i < authRoles.length; i++) {
            if (authRoles[i] == role) {
                return next();
            }
        }
        return res.status(403).json({ message: 'User not allowed' }); // 403 is for forbidden requests
    }
}

export async function checkClassMembership(req: Request, res: Response, next: NextFunction) {

    if ((req as any).user.role == 'site_admin') {
        return next();
    }
    const classroom_id: UUID = req.params.id as UUID;
    const userId: UUID = (req as any).user.userId;
    const text = `
        SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2
        UNION
        SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2
    `;
    const values = [classroom_id, userId];

    const result = await pool.query(text, values)
    if (result.rows.length > 0) {
        return next();
    }
    return res.status(403).json({ message: 'User not allowed' });
}

export async function checkOwnerShip(req: Request, res: Response, next: NextFunction) {
    const classroom_id = req.params.id as UUID;
    const teacher_id = (req as any).user.userId as UUID;

    const text = `SELECT 1 FROM classroom_teachers WHERE classroom_id = $1 AND teacher_id = $2 AND standing = 'owner'`
    const values = [classroom_id, teacher_id]

    const result = await pool.query(text, values)
    if (result.rows.length > 0) {
        return next();
    }
    return res.status(403).json({ message: 'User not allowed' });
}