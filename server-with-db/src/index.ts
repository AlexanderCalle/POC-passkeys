import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import passKeyRoutes from './routes/passkey';
import { errorHandler } from './middlewares/errorHandler';
import config from './config/config';
import connectRedis, { RedisStore } from 'connect-redis';
import { redis } from './lib/redis';
import { createClient } from 'redis';

const app = express();

declare module 'express-session' {
	interface SessionData {
		webAuthnUserID: string;
		currentChallenge: string;
	}
}

// Strict CORS configuration
const corsOptions = {
	origin: config.origin,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
	exposedHeaders: ['Set-Cookie'],
	preflightContinue: false,
	optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.set('trust proxy', 1); // trust first proxy


import Redis from "ioredis"

const client = new Redis(config.redis.protocol);
// Session configuration
const sessionConfig = {
	secret: config.session.secret,
	name: 'webauthn.sid',
	resave: false,
	store: new RedisStore({ client }),
	saveUninitialized: false,
	rolling: true,
	cookie: {
		secure: process.env.NODE_ENV === 'production', // set to true if using HTTPS
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
		path: '/',
	}
};

app.use(session(sessionConfig));

// Parse cookies and JSON body
app.use(cookieParser(config.session.secret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure session is saved before sending response
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
	res.on('finish', () => {
		if (req.session && req.session.save) {
			req.session.save((err) => {
				if (err) console.error('Session save error:', err);
			});
		}
	});
	next();
});

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes);
app.use('/api/passkeys', passKeyRoutes);
app.use(errorHandler);

app.listen(config.port, () => {
	console.info(`🚀 Server started on port: ${config.port}`);
});
