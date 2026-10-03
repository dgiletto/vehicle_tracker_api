import express, { Application } from 'express';
import rootRouter from './routes/index';
import cookieParser from 'cookie-parser';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', rootRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});