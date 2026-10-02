import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConnect from './config/dbConfig.js';
import authRouter from './routes/authRoutes.js';
import empRouter from './routes/employeeRoutes.js';
import cookieParser from 'cookie-parser';
import accountRouter from './routes/accountRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import managementRouter from './routes/managementRoutes.js';
import fileRouter from './routes/fileRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();
// Allowed browser origins: production frontend + local dev (CLIENT_URL from .env)
const allowedOrigins = [
    "https://ta-td-sviet.vercel.app",
    "http://localhost:5173",
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // No Origin header = non-browser client (curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        console.warn("[CORS] Blocked origin:", origin);
        return callback(null, false);
    },
    credentials: true,
}));
app.use(cookieParser())
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
dbConnect();



app.use('/api/auth', authRouter);
app.use('/api/employee', empRouter);
app.use('/api/account', accountRouter);
app.use('/api/admin', adminRouter);
app.use('/api/management', managementRouter);
app.use('/api/files', fileRouter);


app.get('/', (req, res) => {
    res.send('Welcome to the Tasviet Backend API');
});

// Vercel serverless functions don't need app.listen()
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export the Express API for Vercel
export default app;
