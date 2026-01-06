import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index';
import { initializeDatabase, initializeRedis, closeConnections } from './db/index';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import walletRoutes from './modules/wallets/wallets.routes';
import eventRoutes from './modules/events/events.routes';
import groupBuyRoutes from './modules/group-buying/group-buying.routes';
import investmentRoutes from './modules/investments/investments.routes';
import userRoutes from './modules/users/users.routes';
import savingsRoutes from './modules/savings/savings.routes';
import loanRoutes from './modules/loans/loans.routes';

// Import scheduler
import { schedulerService } from './services/scheduler';

// Create Express app
const app = express();

// ===========================================
// MIDDLEWARE
// ===========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.isProduction
        ? ['https://digicoop.ng', 'https://admin.digicoop.ng']
        : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-2FA-Token'],
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });

    next();
});

// ===========================================
// ROUTES
// ===========================================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});

// API routes
const apiPrefix = `/api/${config.apiVersion}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/kyc`, kycRoutes);
app.use(`${apiPrefix}/wallets`, walletRoutes);
app.use(`${apiPrefix}/events`, eventRoutes);
app.use(`${apiPrefix}/group-buy`, groupBuyRoutes);
app.use(`${apiPrefix}/investments`, investmentRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/savings`, savingsRoutes);
app.use(`${apiPrefix}/loans`, loanRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
logger.info(`📄 Swagger docs available at http://localhost:${config.port}/api-docs`);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: {
            code: 'NOT_FOUND',
        },
    });
});

// ===========================================
// ERROR HANDLING
// ===========================================

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error:', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: {
                code: err.code,
                details: err.details,
            },
        });
    }

    // Handle validation errors from express-validator/zod
    if (err.name === 'ValidationError') {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            error: {
                code: 'VALIDATION_ERROR',
                details: err.message,
            },
        });
    }

    // Generic error response
    return res.status(500).json({
        success: false,
        message: config.isProduction ? 'Internal server error' : err.message,
        error: {
            code: 'INTERNAL_ERROR',
            ...(config.isDevelopment && { stack: err.stack }),
        },
    });
});

// ===========================================
// SERVER STARTUP
// ===========================================

async function startServer(): Promise<void> {
    try {
        // Initialize database
        await initializeDatabase();

        // Initialize Redis
        await initializeRedis();

        // Start server
        const server = app.listen(config.port, () => {
            logger.info(`🚀 DigiCoop API server running on port ${config.port}`);
            logger.info(`📍 Environment: ${config.env}`);
            logger.info(`🔗 API endpoint: http://localhost:${config.port}/api/${config.apiVersion}`);
        });

        // Start scheduler
        schedulerService.start();

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                logger.info('HTTP server closed');
                await closeConnections();
                process.exit(0);
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('Forced shutdown due to timeout');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start if this is the main module
if (require.main === module) {
    startServer();
}

export { app, startServer };
