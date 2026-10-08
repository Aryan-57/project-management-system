import { z } from 'zod';

export const projectStatuses = ['Not Started', 'In Progress', 'Completed'] as const;
export const taskStatuses = ['Pending', 'In Progress', 'Completed'] as const;
export const priorities = ['Low', 'Medium', 'High'] as const;
export const idSchema = z.uuid();
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(value + 'T00:00:00.000Z');
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= '1900-01-01' &&
      value <= '9999-12-31'
    );
  }, 'Enter a real calendar date');
const name = z.string().trim().min(1, 'Name is required').max(120);
const description = z.string().trim().max(4000);
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72)
  .refine(
    (v) =>
      Array.from(v).reduce((bytes, char) => {
        const code = char.codePointAt(0)!;
        return bytes + (code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4);
      }, 0) <= 72,
    'Password must be at most 72 bytes',
  );
export const loginSchema = z.strictObject({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password,
});
export const registerSchema = loginSchema.extend({ fullName: z.string().trim().min(2).max(100) });
export const projectSchema = z
  .strictObject({
    name,
    description,
    status: z.enum(projectStatuses),
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after start date',
  });
export const taskSchema = z.strictObject({
  projectId: idSchema,
  name,
  description,
  priority: z.enum(priorities),
  status: z.enum(taskStatuses),
  dueDate: dateSchema,
});
const page = z.coerce.number().int().min(1).max(100000).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(24);
const search = z.string().trim().max(120).optional();
export const projectQuerySchema = z.strictObject({
  search,
  status: z.enum(projectStatuses).optional(),
  page,
  pageSize,
});
export const taskQuerySchema = z.strictObject({
  search,
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(priorities).optional(),
  projectId: idSchema.optional(),
  page,
  pageSize,
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}
export interface Project extends ProjectInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedTaskCount: number;
}
export interface Task extends TaskInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  projectName: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Dashboard {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
}
export interface Session {
  user: User;
  expiresAt: string;
  csrfToken?: string;
  token?: string;
}
export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId: string;
}
