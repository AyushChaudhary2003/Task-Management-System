import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { taskSchema, updateTaskSchema, taskQuerySchema } from '../validators/schemas';
import { AppError } from '../middleware/error.middleware';
import { TaskStatus, Priority } from '../generated/prisma';

// GET /tasks
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const queryParsed = taskQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ message: 'Invalid query parameters' });
    return;
  }

  const { page = 1, limit = 10, status, priority, search } = queryParsed.data;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.title = { contains: search };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({ where }),
  ]);

  res.json({
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + tasks.length < total,
      hasPrev: page > 1,
    },
  });
};

// POST /tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const { title, description, status, priority, dueDate } = parsed.data;

  // Generate an 8-digit numeric string for taskId
  const taskId = Math.floor(10000000 + Math.random() * 90000000).toString();

  const task = await prisma.task.create({
    data: {
      taskId,
      title,
      description,
      status: (status as TaskStatus) || 'PENDING',
      priority: (priority as Priority) || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      userId,
    },
  });

  res.status(201).json({ message: 'Task created successfully', task });
};

// GET /tasks/:id
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const task = await prisma.task.findFirst({ where: { id, userId } });

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  res.json({ task });
};

// PATCH /tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existingTask = await prisma.task.findFirst({ where: { id, userId } });
  if (!existingTask) {
    throw new AppError(404, 'Task not found');
  }

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const { title, description, status, priority, dueDate } = parsed.data;

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status: status as TaskStatus }),
      ...(priority !== undefined && { priority: priority as Priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
  });

  res.json({ message: 'Task updated successfully', task: updatedTask });
};

// DELETE /tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existingTask = await prisma.task.findFirst({ where: { id, userId } });
  if (!existingTask) {
    throw new AppError(404, 'Task not found');
  }

  await prisma.task.delete({ where: { id } });

  res.json({ message: 'Task deleted successfully' });
};

// PATCH /tasks/:id/toggle
export const toggleTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  const newStatus: TaskStatus =
    task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { status: newStatus },
  });

  res.json({ message: 'Task status toggled', task: updatedTask });
};
