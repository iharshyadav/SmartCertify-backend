import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import userRouter from "./routes/user-route";
import mlRouter from "./routes/ml-route";
import certificateRouter from "./routes/certificate-route";
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();
const port = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(cors({
    origin: ['http://localhost:3000', 'https://smart-certify-frontend.vercel.app'],
    credentials: true
}))
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static upload files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


app.use("/api/users", userRouter);
app.use("/api/ml", mlRouter);
app.use("/api/certificates", certificateRouter);
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;