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
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const existingUser = yield prisma_1.default.user.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: { email, password: hashedPassword },
        });
        res.status(201).json({ message: 'User registered successfully!', userId: user.id });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to register user.' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma_1.default.user.findFirst({ where: { email } });
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        res.status(200).json({ accessToken, refreshToken });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to login.' });
    }
});
exports.login = login;
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.sendStatus(401);
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        const user = yield prisma_1.default.user.findFirst({ where: { id: decoded.userId } });
        if (!user || user.refreshToken !== refreshToken) {
            return res.sendStatus(403);
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    }
    catch (err) {
        res.sendStatus(403);
    }
});
exports.refresh = refresh;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req;
    try {
        yield prisma_1.default.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        res.status(200).json({ message: 'Logged out successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to logout.' });
    }
});
exports.logout = logout;
