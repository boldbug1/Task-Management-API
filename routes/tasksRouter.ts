import express, { type Request, type Response } from 'express';
import {GetTasksSchema,PostTasksSchema,PatchTasksSchema} from '../src/schemas/schema.js';
const router = express.Router();
import { getTasks, patchTasks, postTasks } from '../database/queries.js';
import {  verifyToken } from '../middleware/auth.js';

   
router.get('/', async (req :Request, res:Response) => {
  try {
    const queryParse = GetTasksSchema.safeParse(req.query);

    if (!queryParse.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: queryParse.error.format() });
    }

    const { name, priority, page, limit } = queryParse.data;
    const offset = (page - 1) * limit;

    const response = await getTasks(name,priority,limit,offset,page);

    console.log(response)
    res.status(200).json(response)
  } catch(error) {
    console.error(error); 
    return res.status(500).json({ error: 'Error while fetching data' });
  }
})

router.post('/',verifyToken, async (req:Request, res:Response) => {
  try {
    const bodyParse = PostTasksSchema.safeParse(req.body);

    if(!bodyParse.success){
      return res.status(400).json({ error: 'Invalid body data', details: bodyParse.error.format() });
    }

    const {title,assigned_to,priority,status,due_date} = bodyParse.data;

    const response = await postTasks(title,assigned_to,priority,status,due_date);

    res.status(201).json(response);
  } catch (error) {
    console.log(`${error}`)
    console.log('Database Error : Error while post data')
    return res.status(500).json("Error while posting data")
  }
})

router.patch('/:id', async (req:Request, res:Response) => {
  try {
   
    const taskId = req.params.id;
    const bodyParse = PatchTasksSchema.safeParse(req.body);
    if (!taskId || Array.isArray(taskId)) {
      return res.status(400).json({ error: "Invalid Task ID format" });
    }
    if(!bodyParse.success){
      return res.status(400).json({error:'Invalid body data',details:bodyParse.error.format()});
    }

    const Updates = bodyParse.data;

    if (Object.keys(Updates).length == 0) {
      return res.status(400).json({ error: 'No update fields provided' })
    }

    const updatedTask = await patchTasks(taskId,Updates);

    if(!updatedTask){
      return res.status(404).json("Task not found");
    }

    return res.status(200).json(updatedTask);
    
  } catch (error) {
    console.error('Patch Execution Error:', error)
    return res.status(500).json('Error updating task parameters');
  }
});

export default router;