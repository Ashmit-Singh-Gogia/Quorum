import express, { type Express, type Request, type Response } from 'express';
import authRoutes from './auth/auth.routes.js'
import classroomsRoutes from './classrooms/classrooms.routes.js'
const app: Express = express();

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/classrooms', classroomsRoutes);

//health route
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
});

export default app;