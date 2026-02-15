import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint - must be before other routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'DataRand backend is running.' });
});

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
    }));
}

// Add routes
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import computeRoutes from './routes/computeRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/compute', computeRoutes);
app.use('/api/v1/network', networkRoutes);


// Centralized error handling
app.use(errorMiddleware);

export { app };
