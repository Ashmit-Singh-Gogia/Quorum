import express, { type Express, type Request, type Response } from 'express';
import authRoutes from './auth/auth.routes.js'
const app: Express = express();

app.use(express.json());
app.use('/auth', authRoutes);

//health route
app.get('/health', (req: Request, res: Response) => {
    res.send('hello world');
});

export default app;