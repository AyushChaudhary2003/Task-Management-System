"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const register = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword },
        });
        res.status(201).json({ message: 'User registered successfully!', userId: user.id });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to register user.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        res.status(200).json({ accessToken, refreshToken });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to login.' });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.sendStatus(401);
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.refreshToken !== refreshToken) {
            return res.sendStatus(403);
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    }
    catch (err) {
        res.sendStatus(403);
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    const { userId } = req;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        res.status(200).json({ message: 'Logged out successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to logout.' });
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map