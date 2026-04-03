import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    userId?: string;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map