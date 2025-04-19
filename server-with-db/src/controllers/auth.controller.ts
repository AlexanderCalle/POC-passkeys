import { Request, Response, NextFunction, json, response } from 'express';
import { AuthenticationResponseJSON, generateAuthenticationOptions, GenerateAuthenticationOptionsOpts, generateRegistrationOptions, GenerateRegistrationOptionsOpts, verifyAuthenticationResponse, verifyRegistrationResponse, WebAuthnCredential } from '@simplewebauthn/server';
import config from '../config/config';
import { createUser, getUser, updateUser } from '../services/user.service';
import { createPasskey, getUserPaskeys } from '../services/passkey.service';
import jwt from 'jsonwebtoken';

const contextBuffer = (buffer: Uint8Array) => Buffer.from(buffer);
type UserDevices = Array<{ 
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  transports: AuthenticatorTransport[];
}>;

export const registrationStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.body.username;
    console.log('Initial session:', req.session.id);

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
    
    // Store the challenge as a base64url string
    const challengeBuffer = Buffer.from(options.challenge);
    const challengeBase64 = challengeBuffer.toString('base64url');
    
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
    const { username, name, deviceName, data } = req.body;    
    console.log(req.body)

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

    const {verified, registrationInfo} = verification;
    let token: string = '';
    if (verified && registrationInfo) {
      let user = await getUser(username);
      if (!user) {
        user = await createUser(username, name);
      }

      const { credential } = registrationInfo;
      
      const publicKeyToStore = contextBuffer(credential.publicKey);

      await updateUser(user.id, user);

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
      res.cookie('user', JSON.stringify({ id: user.id, name: user.name }), { maxAge: 3600000 });
      token = await generateToken({ id: user.id, name: user.name });
    }
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

const generateToken = async (user: any) => {
  return await jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: 3600,
  });
}