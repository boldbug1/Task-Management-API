import { z } from 'zod';

export const GetTasksSchema = z.object({
  name: z.string().default(''),
  priority: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(3),
});

export const PostTasksSchema = z.object({
  title: z.string().min(1, "Title is required"),
  assigned_to: z.string().min(1),
  priority: z.string(),
  status: z.string(),
  due_date: z.string().optional(),
});

export const PatchTasksSchema = PostTasksSchema.partial();