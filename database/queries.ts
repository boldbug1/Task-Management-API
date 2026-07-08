import { number } from "zod";
import pool from "./pool.js"

interface TaskUpdates {
  title?: string;
  assigned_to?: string;
  priority?: string;
  status?: string;
  due_date?: string | Date;
}

export async function getTasks(assigned_person:string, priority:string|undefined, limit:number, offset:number, current_page:number) {

  try {
    let queryParams:(string | number)[] = [assigned_person + '%']
    let baseWhereClause = `WHERE assigned_to ILIKE $1`

    if (priority) {
      queryParams.push(priority)
      baseWhereClause += ` AND priority = $${queryParams.length}`
    }
    const tasksQuery = `
    SELECT * FROM tasks
    ${baseWhereClause}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2};
    `

    const tasksResults = await pool.query(tasksQuery, [
      ...queryParams,
      limit,
      offset
    ])

    const countQuery = `
    SELECT COUNT(*) AS total FROM tasks
    ${baseWhereClause};
    `

    const countResults = await pool.query(countQuery, [...queryParams])
    const totalCount = parseInt(countResults.rows[0]?.total) || 0

    const response = {
      tasks: tasksResults.rows,
      meta: {
        currentPage: current_page,
        limit: limit,
        totalTasks: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }

    return response;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error); //learn how this works
    console.error("Database error in getTasks", errMsg);
    throw error;
  }
}


export async function postTasks(title:string, assigned_to:string,priority:string,status:string,due_date:string|undefined) {
  try {
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
  ]);

  if (tasksCreate.rows.length === 0) {
       throw new Error("Task creation failed: No data returned.");
     }
 
  return tasksCreate.rows[0]; 
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Database error in postTasks", errMsg);
    throw error;
}
}


export async function patchTasks(taskId:number,Updates:TaskUpdates) {

  try{
    let queryPart:(string|number)[] = []
    let queryValues: = []
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

    const updatedTask = await pool.query(updateQuery, queryValues);
    
    return updatedTask?.rows[0];
  }catch(error){
    console.error("Database error patchTasks",error.message);
    throw error;
  }
}