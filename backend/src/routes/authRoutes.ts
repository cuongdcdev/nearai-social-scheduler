import { Router } from 'express';
import { authenticate } from '../libs/nearAuthentication';
import { AppDataSource } from '../dataSource';
import { User } from '../entities/User';
import { createToken } from '../middlewares/authMiddleware';

const jwt = require('jsonwebtoken');

const authRoutes = Router();

authRoutes.post('/login', async (req, res) => {
    try {
        const { 
            accountId, 
            publicKey, 
            signature, 
            message, 
            recipient,
            nonce 
        } = req.body;
        
        if (!accountId || !publicKey || !signature || !message || !recipient || !nonce) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required parameters' 
            });
        }

        // Convert nonce from base64 string to Uint8Array
        const nonceArray = new Uint8Array(Buffer.from(nonce, 'base64'));
        
        // Authenticate using NEAR
        const isAuthenticated = await authenticate({
            accountId,
            publicKey,
            signature,
            message,
            recipient,
            nonce: nonceArray
        });
        
        if (!isAuthenticated) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication failed' 
            });
        }
        
        // Look up the user by accountId (which is stored in the name field)
        const userRepository = AppDataSource.getRepository(User);
        let user = await userRepository.findOne({ where: { name: accountId } });
        
        // If user doesn't exist, create a new one
        if (!user) {
            user = userRepository.create({
                name: accountId, // name field is the accountId
                telegram_bot_token: '' // Initialize with empty token
            });
            await userRepository.save(user);
        }
        
        // Generate JWT token
        const token = createToken(user);
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                accountId: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during authentication' 
        });
    }
});

// Endpoint to verify if token is valid
authRoutes.get('/verify-token', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.json({ isValid: false });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
        return res.json({ isValid: false });
    }
    
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({ isValid: true, user: decoded });
    } catch (error) {
        return res.json({ isValid: false });
    }
});

export default authRoutes;