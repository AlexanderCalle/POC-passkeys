import { Request, Response, NextFunction } from 'express';
import config from '../config/config';
import { AuthenticationResponseJSON, generateAuthenticationOptions, GenerateAuthenticationOptionsOpts, generateRegistrationOptions, GenerateRegistrationOptionsOpts, verifyAuthenticationResponse, verifyRegistrationResponse, WebAuthnCredential } from '@simplewebauthn/server';
import crypto from 'crypto';
import { createUser, getUser, getUserByEmail } from '../services/user.service';
import { createPasskey, getUserPaskeys } from '../services/passkey.service';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis';
import { transporter } from '../lib/nodemailer';
import { contextBuffer, verifyRegistrationOptions } from '../lib/webauthn';
import { hashFromOtp } from '../lib/hash';

type UserDevices = Array<{ 
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  transports: AuthenticatorTransport[];
}>;

export const registrationStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.body.username;

    const user = await getUser(username);
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
};

export const verifyRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, name, email, deviceName, data } = req.body;    

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
      return await createUser(username, email, name);
    });
   
    req.session.currentChallenge = undefined;
    req.session.webAuthnUserID = undefined;

    res.status(200).send({ verified, token });
  } catch (error) {
    next(error)
  }
}

export const authenticationStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.body.username;
    const user = await getUser(username);
    const passkeys = await getUserPaskeys(user);
    if (!user) {
      res.status(404).send(false);
      return;
    }
    
    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: passkeys?.map((passkey) => ({
        id: passkey.passkey_id,
        transports: [passkey.device_type] as AuthenticatorTransport[],
      })),
      userVerification: 'preferred',
      rpID: config.replyingPartyId,
    };

    const options = await generateAuthenticationOptions(opts);
    req.session.currentChallenge = options.challenge;

    res.json(options);
  } catch (error) {
    next(error);
  }
};

export const verifyAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assertion, username } = req.body;
    const user = await getUser(username);
    const passkeys = await getUserPaskeys(user);
    
    if (!user) {
      res.status(404).send({ error: 'User not found' });
      return
    }
    if (!req.session.currentChallenge) {
      res.status(400).send({ error: 'Challenge not found' });
      return
    }

    let dbAuthenticator: WebAuthnCredential | null = null;
    if (!passkeys) {
      res.status(400).send({ error: 'No passkeys found' });
      return
    }

    for (const passkey of passkeys) {
      if (passkey.passkey_id === assertion.id) {
        dbAuthenticator = {
          id: passkey.passkey_id,
          publicKey: passkey.public_key,
          counter: Number(passkey.counter),
        };
        break;
      }
    }
    if (!dbAuthenticator) {
      res.status(400).send({ error: 'Authenticator not found' });
      return
    }

    let verification;
    const response: AuthenticationResponseJSON = req.body.assertion;    
    verification = await verifyAuthenticationResponse({
      response: {
        ...response,
        type: 'public-key',
      },
      expectedChallenge: req.session.currentChallenge,
      credential: dbAuthenticator,
      expectedRPID: config.replyingPartyId,
      expectedOrigin: config.origin,
      requireUserVerification: false
    });
   
    const {verified} = verification;
    const token = await generateToken(user);
    res.status(200).send({verified, token});
  }
  catch (error) {
    next(error);
  }
}

export const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).send({ error: 'Email is required' });
    return;
  }
  
  try {
    const otp = crypto.randomInt(100000, 999999).toString();
    await redis.setex(email, 300, otp);

    await transporter.sendMail({
      from: 'no-reply@despieghel.be',
      to: email,
      subject: 'OTP for webauthn-app',
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    })

    res.status(200).send({ message: "OTP sent to email" });
  } catch (error) {
    next(error);
  }
}

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    res.status(400).send({ error: 'Email and OTP are required' });
    return;
  }

  try {
    const storedOTP = await redis.get(email);
    if (!storedOTP) {
      res.status(400).send({ error: 'OTP expired or invalid' });
      return;
    }

    if (storedOTP.toString() !== otp) {
      res.status(400).send({ message: 'Invalid' });
    }
    
    await redis.del(email);
    const hash = hashFromOtp(otp);
    await redis.setex(email, 600, hash);
    res.status(200).send({ message: 'Valid', hash });
  } catch (error) {
    next(error);
  }
}

export const generateToken = async (user: any) => {
  return await jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: 3600,
  });
}