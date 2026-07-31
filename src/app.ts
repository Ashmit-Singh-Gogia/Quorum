import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();

//health route
app.get('/health', (req: Request, res: Response) => {
    console.log("Health check success");
    res.send('hello world');
});
export default app;