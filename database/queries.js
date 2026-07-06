import pool from "./pool.js"

export async function getTasks(assigned_person,priority,limit,offset,current_page){
    let queryParams = [assigned_person + '%']
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
    SELECT COUNT(*) FROM tasks
    ${baseWhereClause};
    `

    const countResults = await pool.query(countQuery, [...queryParams])

    const totalCount = parseInt(countResults.rows[0].count)

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
}