import { cors } from '@elysiajs/cors';

export const corsMiddleware = cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
    exposedHeaders: ['x-refresh-token', 'x-user-role', 'x-username'],
    credentials: false
});
