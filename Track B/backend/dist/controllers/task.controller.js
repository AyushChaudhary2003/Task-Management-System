"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTask = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const crypto_1 = require("crypto");
const prisma_1 = __importDefault(require("../utils/prisma"));
const generateId = () => {
    return (10000000 + (0, crypto_1.randomInt)(90000000)).toString();
};
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search = '' } = req.query;
    const userId = req.userId;
    try {
        const tasks = yield prisma_1.default.task.findMany({
            where: {
                userId,
                title: { contains: String(search) }
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });
        const totalCount = yield prisma_1.default.task.count({
            where: { userId, title: { contains: String(search) } }
        });
        res.status(200).json({ tasks, totalCount, page, totalPages: Math.ceil(totalCount / Number(limit)) });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
});
exports.getTasks = getTasks;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, dueDate, priority } = req.body;
    const userId = req.userId;
    if (!title || !dueDate) {
        return res.status(400).json({ error: 'Title and dueDate are required.' });
    }
    try {
        // @ts-ignore
        const task = yield prisma_1.default.task.create({
            data: {
                id: generateId(),
                title,
                description,
                dueDate: new Date(dueDate),
                priority: priority || 'MEDIUM',
                user: { connect: { id: userId } }
            }
        });
        res.status(201).json(task);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create task.' });
    }
});
exports.createTask = createTask;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, description, dueDate, priority, status } = req.body;
    const userId = req.userId;
    try {
        // @ts-ignore
        const task = yield prisma_1.default.task.findFirst({ where: { id } });
        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        // @ts-ignore
        const updatedTask = yield prisma_1.default.task.update({
            where: { id },
            data: {
                title: title !== null && title !== void 0 ? title : undefined,
                description: description !== null && description !== void 0 ? description : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                priority: priority !== null && priority !== void 0 ? priority : undefined,
                status: status !== null && status !== void 0 ? status : undefined
            }
        });
        res.status(200).json(updatedTask);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update task.' });
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.userId;
    try {
        // @ts-ignore
        const task = yield prisma_1.default.task.findFirst({ where: { id } });
        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        // @ts-ignore
        yield prisma_1.default.task.delete({ where: { id } });
        res.status(200).json({ message: 'Task deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete task.' });
    }
});
exports.deleteTask = deleteTask;
const toggleTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.userId;
    try {
        // @ts-ignore
        const task = yield prisma_1.default.task.findFirst({ where: { id } });
        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        // @ts-ignore
        const updatedTask = yield prisma_1.default.task.update({
            where: { id },
            data: { status: newStatus }
        });
        res.status(200).json(updatedTask);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to toggle task.' });
    }
});
exports.toggleTask = toggleTask;
