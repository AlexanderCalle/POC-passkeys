import { NextFunction, Request, Response } from "express";
import { prismaClient } from "../client";
import { getUser, getUserByEmail } from "../services/user.service";
import { createPasskey, getUserPaskeys } from "../services/passkey.service";
import { generateRegistrationOptions, GenerateRegistrationOptionsOpts, verifyRegistrationResponse } from "@simplewebauthn/server";
import config from "../config/config";
import { generateToken } from "./auth.controller";
import { contextBuffer, generateRegistration, verifyRegistrationOptions } from "../lib/webauthn";
import { redis } from "../lib/redis";
import { verifyHash } from "../lib/hash";

export const startRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.body.username;

    const user = await getUser(username);
    if (!user) {
      res.status(404).send(false);
      return;
    }
    
    const options = await generateRegistration(user);
    
    req.session.currentChallenge = options.challenge;
    req.session.webAuthnUserID = options.user.id;

    res.setHeader('Set-Cookie', [
      `webauthn.sid=${req.session.id}; Path=/; HttpOnly; SameSite=Lax`
    ]);

    res.json(options);

  } catch (error) {
    next(error);
  }
}

export const verifyRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, deviceName, data } = req.body;   
    const user = await getUser(username);
    if (!user) {
      res.status(404).send(false);
      return;
    }

    if (!req.session.currentChallenge) {
      res.status(400).json({ 
        error: 'Challenge not found',
        sessionId: req.session.id,
        sessionData: req.session
      });
      return;
    }

    const { verified, token } = await verifyRegistrationOptions({
      username,
      deviceName,
      currentChallenge: req.session.currentChallenge,
      response: data,
      webAuthnUserID: req.session.webAuthnUserID ?? '',
    }, async () => {
      return user;
    });

    req.session.currentChallenge = undefined;
    req.session.webAuthnUserID = undefined;

    res.status(200).send({ verified, token });
  } catch (error) {
    next(error)
  }
}

export const recoverStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, hash } = req.body;
    if (!email || !hash) {
      res.status(400).send({ error: 'Email and hash are required' });
      return;
    }

    const storedHash = await redis.get(email);
    if (!storedHash) {
      res.status(400).send({ error: 'OTP expired or invalid' });
      return;
    }
    if(!verifyHash(hash, storedHash.toString())) {
      res.status(400).send({ error: 'OTP expired or invalid' });
      return;
    }

    await redis.del(email);
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(404).send({ error: 'User not found' });
      return;
    }
    req.body.username = user.username;
    await startRegister(req, res, next);
  } catch (error) {
    next(error);
  }
}

export const recoverVerify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, deviceName, data } = req.body;   
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(404).send({ error: 'User not found' });
      return;
    }

    if (!req.session.currentChallenge) {
      res.status(400).json({ 
        error: 'Challenge not found',
        sessionId: req.session.id,
        sessionData: req.session
      });
      return;
    }

    const { verified, token } = await verifyRegistrationOptions({
      username: user.username,
      deviceName,
      currentChallenge: req.session.currentChallenge,
      response: data,
      webAuthnUserID: req.session.webAuthnUserID ?? '',
    }, async () => {
      return user;
    });

    req.session.currentChallenge = undefined;
    req.session.webAuthnUserID = undefined;

    res.status(200).send({ verified, token });
  } catch (error) {
    next(error)
  }
}

export const updatePasskey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { device_name } = req.body;
    const { id } = req.params;

    await prismaClient.passKey.update({
      where: {
        id: Number(id),
      },
      data: {
        name: device_name,
      },
    })
    res.status(200).send(true);
  } catch (error) {
    next(error);
  }
}

export const deletePasskey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const passkey = await prismaClient.passKey.findFirst({
      where: {
        id: Number(id),
      },
    });

    const passkeys = await prismaClient.passKey.findMany({
      where: {
        user_id: passkey?.user_id,
      },
    });

    if (passkeys.length === 1) {
      res.status(400).send({ error: 'Cannot delete last passkey' });
      return;
    }

    await prismaClient.passKey.delete({
      where: {
        id: Number(id),
      },
    });
    
    res.status(200).send(true);
  } catch (error) {
    next(error);
  }
}