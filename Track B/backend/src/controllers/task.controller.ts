import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  userId?: string;
}

const generateId = () => {
    return (10000000 + randomInt(90000000)).toString();
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const userId = req.userId!;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        title: { contains: String(search) }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = await prisma.task.count({
      where: { userId, title: { contains: String(search) } }
    });

    res.status(200).json({ tasks, totalCount, page, totalPages: Math.ceil(totalCount / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const { title, description, dueDate, priority } = req.body;
  const userId = req.userId!;

  if (!title || !dueDate) {
    return res.status(400).json({ error: 'Title and dueDate are required.' });
  }

  try {
    // @ts-ignore
    const task = await prisma.task.create({
      data: {
        id: generateId(),
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        user: { connect: { id: userId } }
      } as any
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate, priority, status } = req.body;
  const userId = req.userId!;

  try {
    // @ts-ignore
    const task = await prisma.task.findFirst({ where: { id } as any });
    if (!task || task.userId !== userId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // @ts-ignore
    const updatedTask = await prisma.task.update({
      where: { id } as any,
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority: priority ?? undefined,
        status: status ?? undefined
      } as any
    });

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    // @ts-ignore
    const task = await prisma.task.findFirst({ where: { id } as any });
    if (!task || task.userId !== userId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // @ts-ignore
    await prisma.task.delete({ where: { id } });
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};

export const toggleTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    // @ts-ignore
    const task = await prisma.task.findFirst({ where: { id } as any });
    if (!task || task.userId !== userId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    // @ts-ignore
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: newStatus }
    });

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle task.' });
  }
};
