import express, { Request, Response, NextFunction } from 'express';
import userRouter from "./routes/auth-route"
// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route

app.use("/api/users",userRouter);
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;