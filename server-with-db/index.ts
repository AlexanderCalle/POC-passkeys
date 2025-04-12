import express from 'express';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { prismaClient } from './src/client';
import { WEBPORT } from './src/const';

import authRoutes from './src/routes/auth';

const app = express();
const prisma = prismaClient;

async function main() {
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'front')));

    app.use('/', authRoutes);
    
    app.listen(WEBPORT, () => {
        console.info(`Server started on port: ${WEBPORT}`);
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });