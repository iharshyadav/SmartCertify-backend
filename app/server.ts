import 'dotenv/config';
import express from 'express';
import userRouter from "./routes/user-route";
import mlRouter from "./routes/ml-route";
import certificateRouter from "./routes/certificate-route";
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();
const port = process.env.PORT || 8000;

app.use(express.json({ limit: '50mb' }));
app.use(cors({
    origin: ['http://localhost:3000', 'https://smart-certify-frontend.vercel.app'],
    credentials: true
}))
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use("/api/users", userRouter);
app.use("/api/ml", mlRouter);
app.use("/api/certificates", certificateRouter);
app.get('/', (_req: any, res: any) => {
    res.send('Hello, world!');
});
if (process.env.VERCEL !== "1") {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;