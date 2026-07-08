import {z} from 'zod';

export const GetTasksSchema = z.object({
    name:z.string().default(''),
    priority:z.string().optional(),
    page:z.string().transform(Number).pipe(z.number().positive().int()).default(1),
    limit:z.string().transform(Number).pipe(z.number().positive().int()).default(3)
});

export const PostTasksSchema = z.object({
    title: z.string().min(1, "Title is required"),
    assigned_to: z.string().min(1),
    priority: z.string(),
    status: z.string(),
    due_date: z.string().datetime().optional()
})

export const PatchTasksSchema = PostTasksSchema.partial();