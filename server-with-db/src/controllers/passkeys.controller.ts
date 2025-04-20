import { NextFunction, Request, Response } from "express";
import { prismaClient } from "../client";
import { getUser } from "../services/user.service";
import { createPasskey, getUserPaskeys } from "../services/passkey.service";
import { generateRegistrationOptions, GenerateRegistrationOptionsOpts, verifyRegistrationResponse } from "@simplewebauthn/server";
import config from "../config/config";
import { contextBuffer, generateToken } from "./auth.controller";

export const startRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.body.username;

    const user = await getUser(username);
    if (!user) {
      res.status(404).send(false);
      return;
    }
    const passkeys = await getUserPaskeys(user);

    const pubKey: GenerateRegistrationOptionsOpts = {
      rpName: config.relyingPartyName,
      rpID: config.replyingPartyId,
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: passkeys?.map((passkey) => ({
        id: passkey.passkey_id,
        type: 'public-key',
        transports: [passkey.device_type] as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(pubKey);
    
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
    // Verification
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: data,
        expectedChallenge: req.session.currentChallenge,
        expectedOrigin: config.origin,
      });
    } catch (error) {
      if(error instanceof Error) {
        res.status(400).send({error: error.message});
        return;
      }
      res.status(500).send(false);
      return;
    }
    if(!verification) {
      res.status(500).send(false);
      return;
    }

    const { verified, registrationInfo } = verification;
    let token: string = '';
    if (verified && registrationInfo) {
      const { credential } = registrationInfo;
      const publicKeyToStore = contextBuffer(credential.publicKey);

      const webAuthnUserID = req.session.webAuthnUserID;
      await createPasskey({
        passkey_id: credential.id,
        public_key: publicKeyToStore,
        name: deviceName,
        user_id: user.id,
        webauthnUser_id: webAuthnUserID || '',
        counter: BigInt(credential.counter),
        device_type: registrationInfo.credentialDeviceType,
        back_up: registrationInfo.credentialBackedUp,
      })
      
      token = await generateToken({ id: user.id, name: user.name });
    }
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
    await prismaClient.passKey.delete({
      where: {
        id: Number(id),
      },
    })
    res.status(200).send(true);
  } catch (error) {
    next(error);
  }
}