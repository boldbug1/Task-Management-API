import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import tasksRouter from '../routes/tasksRouter.js';

const whiteList = ['http://localhost:3000'];

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/tasks', tasksRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json('server is running');
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log('Server is listening at http://localhost:3000');
});
