import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DigiCoop API',
            version: '1.0.0',
            description: 'API documentation for DigiCoop Banking Platform',
            contact: {
                name: 'API Support',
                email: 'support@digicoop.ng',
            },
            license: {
                name: 'Private',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api/${config.apiVersion}`,
                description: 'Development Server',
            },
            {
                url: 'https://api.digicoop.ng/api/v1',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.validation.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
