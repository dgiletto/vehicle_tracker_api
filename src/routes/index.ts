import { Router, Response, Request } from 'express';
import authRouter from './auth';
import userRouter from './user';
import vehicleRouter from './vehicle';

const rootRouter = Router();

rootRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

rootRouter.use("/auth", authRouter);
rootRouter.use("/users", userRouter);
rootRouter.use("/vehicles", vehicleRouter);

export default rootRouter;