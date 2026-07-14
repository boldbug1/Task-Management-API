import pool from './pool.js';
import bcrypt from 'bcryptjs';

const createTableIfNotExists = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

export async function createUser(username: string, password: string) {
  await createTableIfNotExists();

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at`,
    [username, hashedPassword]
  );

  return result.rows[0] as { id: number; username: string; created_at: string };
}

export async function getUserByUsername(username: string) {
  const result = await pool.query(
    `SELECT id, username, password_hash, created_at FROM users WHERE username = $1`,
    [username]
  );

  return (result.rows[0] as { id: number; username: string; password_hash: string; created_at: string } | undefined) ?? null;
}
