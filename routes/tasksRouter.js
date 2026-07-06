import express from 'express';
const router = express.Router();
import pool from '../database/pool.js'
import { getTasks } from '../database/queries.js';


router.get('/', async (req, res) => {
  try {
    const assigned_person = req.query.name || ''
    const priority = req.query.priority
    const current_page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 3
    const offset = (current_page - 1) * limit

    const response = await getTasks(assigned_person,priority,limit,offset,current_page);

    console.log(response)
    res.status(200).json(response)
  } catch {
    res.status(500).json('Error while fetching data')
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, assigned_to, priority, status, due_date } = req.body
    console.log(title)
    const taskCreateQuery = `
    INSERT INTO tasks (title,assigned_to,priority,status,due_date)
    VALUES ($1,$2,$3,$4,$5) 
    RETURNING *;
    `
    const tasksCreate = await pool.query(taskCreateQuery, [
      title,
      assigned_to,
      priority,
      status,
      due_date
    ])
    res.status(201).json(tasksCreate.rows[0])
  } catch (error) {
    console.log(`${error}`)
    console.log('Database Error : Error while post data')
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const taskId = req.params.id
    const Updates = req.body

    if (Object.keys(Updates).length == 0) {
      return res.status(400).json({ error: 'No update fields provided' })
    }

    let queryParts = []
    let queryValues = []
    let PlaceHolderIndex = 1
    for (const key in Updates) {
      if (
        ['title', 'assigned_to', 'priority', 'status', 'due_date'].includes(key)
      ) {
        queryParts.push(`${key} = $${PlaceHolderIndex}`)
        queryValues.push(Updates[key])
        PlaceHolderIndex++
      }
    }

    queryValues.push(taskId)
    const idPlaceHolder = `$${PlaceHolderIndex}`

    const updateQuery = `
    UPDATE tasks
    SET ${queryParts.join(',')}
    WHERE task_id = ${idPlaceHolder}
    RETURNING *;
    `

    const result = await pool.query(updateQuery, queryValues)

    if (result.rows.length === 0) {
      return res.status(404).json('Task not found')
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error('Patch Execution Error:', error)
    res.status(500).json('Error updating task parameters');
  }
});

export default router;