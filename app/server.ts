import express, { Request, Response, NextFunction } from 'express';
import userRouter from "./routes/user-route"
// Create Express application
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/users",userRouter);
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;