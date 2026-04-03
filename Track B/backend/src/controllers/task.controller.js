"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTask = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
const generateId = () => {
    return (10000000 + (0, crypto_1.randomInt)(90000000)).toString();
};
const getTasks = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const userId = req.userId;
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    const { title, description, dueDate, priority } = req.body;
    const userId = req.userId;
    if (!title || !dueDate) {
        return res.status(400).json({ error: 'Title and dueDate are required.' });
    }
    try {
        const task = await prisma.task.create({
            data: {
                id: generateId(),
                title,
                description,
                dueDate: new Date(dueDate),
                priority: priority || 'MEDIUM',
                userId
            }
        });
        res.status(201).json(task);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create task.' });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, priority, status } = req.body;
    const userId = req.userId;
    try {
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title: title ?? undefined,
                description: description ?? undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                priority: priority ?? undefined,
                status: status ?? undefined
            }
        });
        res.status(200).json(updatedTask);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update task.' });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    try {
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        await prisma.task.delete({ where: { id } });
        res.status(200).json({ message: 'Task deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete task.' });
    }
};
exports.deleteTask = deleteTask;
const toggleTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    try {
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        const updatedTask = await prisma.task.update({
            where: { id },
            data: { status: newStatus }
        });
        res.status(200).json(updatedTask);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to toggle task.' });
    }
};
exports.toggleTask = toggleTask;
//# sourceMappingURL=task.controller.js.map