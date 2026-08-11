import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth.service.js'

export function authenticate(req: Request, res: Response, next: NextFunction) {

    const authHeader = req.get('authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Invalid token format' });
    }
    const token: string = authHeader.split(' ')[1] ?? '';

    try {
        let userDetail: { userId: string, role: string } | null = verifyToken(token)
        if (!userDetail) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        (req as any).user = userDetail;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }

};