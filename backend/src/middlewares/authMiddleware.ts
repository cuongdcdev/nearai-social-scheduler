import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

export interface AuthRequest extends Request {
    user?: {
        id: number;
        accountId: string;
    };
}

export const createToken = (user: { id: number; name: string }): string => {
    return jwt.sign(
        { 
            id: user.id, 
            accountId: user.name // name field is the accountId
        }, 
        JWT_SECRET, 
        { 
            expiresIn: '7d' // Token expires in 7 days
        }
    );
};

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        res.status(401).json({ message: 'No authorization header provided' });
        return;
    }
    
    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; accountId: string };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};