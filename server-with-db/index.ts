import express from 'express';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import prismaClient from './client';
import constData from './const';

import indexRoutes from './routes/index';
import authRoutes from './routes/auth';
import notFoundRoute from './routes/notFound';

const app = express();
const PORT = constData.WEBPORT;
const prisma = prismaClient;

async function main() {
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'front')));

    // using ejs for view
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use('/', indexRoutes);
    app.use('/', authRoutes);
    app.use(notFoundRoute);
    
    app.listen(PORT, () => {
        console.info(`Server started on port: ${PORT}`);
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