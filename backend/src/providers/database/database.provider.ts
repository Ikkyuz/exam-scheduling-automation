import { PrismaClient } from './generated/client'; 

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

export default prisma;
