import dotenv from 'dotenv';
import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import { AppDataSource } from './dataSource'
import userRoutes from './routes/userRoutes'
import distributionChannelRoutes from './routes/distributionChannelRoutes'
import postRoutes from './routes/postRoutes'
import { initializeScheduler } from './services/initializeScheduler'
import { initializeTelegramFetcher } from './services/fetchers/telegramFetcher'
import authRoutes from './routes/authRoutes';
import { verifyToken, AuthRequest } from './middlewares/authMiddleware';
import sourceChannelRoutes from './routes/sourceChannelRoutes';


dotenv.config();
const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors())
app.use(express.json())


app.use('/api/auth', authRoutes);

// Routes
app.use('/api/users', verifyToken, userRoutes)
app.use('/api/sources',verifyToken, sourceChannelRoutes)

// app.use('/api/channels',verifyToken, distributionChannelRoutes)
// app.use('/api/posts', verifyToken, postRoutes)


// Initialize database connection
AppDataSource.initialize()
    .then(async () => {
        console.log("Data Source has been initialized!")
        
        // Initialize scheduler & fetchers
        await initializeScheduler()
        await initializeTelegramFetcher(); 

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })
    .catch((error) => console.log("Error during Data Source initialization:", error))

export default app