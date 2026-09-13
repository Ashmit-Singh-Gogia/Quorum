import express, { type Express, type Request, type Response } from 'express';
import authRoutes from './auth/auth.routes.js'
import classroomsRoutes from './classrooms/classrooms.routes.js'
import assignmentRoutes from './assignments/assignments.routes.js'
import courseRoutes from './courses/courses.routes.js'
import cors from 'cors';

const app: Express = express();

app.use(express.json());

app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  // needed if you send cookies or auth headers
}));


app.use('/auth', authRoutes);
app.use('/classrooms', classroomsRoutes);
app.use('/courses', courseRoutes);
app.use('/assignments', assignmentRoutes);

//health route
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
});

export default app;