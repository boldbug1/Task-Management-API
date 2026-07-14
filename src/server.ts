import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import tasksRouter from '../routes/tasksRouter.js';
import logger from '../middleware/logger.js'
import authRouter from '../routes/authRouter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const whiteList = ['http://localhost:3000', null];

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || whiteList.includes(origin as string)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log('Server is listening at http://localhost:3000');
});
