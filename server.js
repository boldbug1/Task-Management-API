import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import tasksRouter from './routes/tasksRouter.js';

const whiteList = ['http://localhost:3000'];

const corsOptions = {
  origin:function (origin,callback){
    if(whiteList.includes(origin) || !origin){
      callback(null,true);
    }else{
      callback(new Error("Blocked by CORS policy"));
    }
  }
}

const app = express()
app.use(cors(corsOptions))
app.use(express.json())
app.use("/api/tasks",tasksRouter);



app.get('/', (req, res) => {
  res.json('server is running')
})



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server is listening at http://localhost:3000')
})
