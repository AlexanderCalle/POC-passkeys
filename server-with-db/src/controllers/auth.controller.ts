import { Request, Response, NextFunction } from 'express';
import { AuthenticationResponseJSON, generateAuthenticationOptions, GenerateAuthenticationOptionsOpts, generateRegistrationOptions, GenerateRegistrationOptionsOpts, verifyAuthenticationResponse, verifyRegistrationResponse, WebAuthnCredential } from '@simplewebauthn/server';
import config from '../config/config';
import { createUser, getUser, updateUser } from '../services/user.service';
import { createPasskey, getUserPaskeys } from '../services/passkey.service';

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
      excludeCredentials: (user?.devices as UserDevices).map((device) => ({
        id: device.credentialID,
        type: 'public-key',
        transports: device.transports,
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
    
    req.session.currentChallenge = challengeBase64;
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
    const { username, data: response } = req.body;    
    console.log('Verify session ID:', req.session.id);
    console.log('Verify session data:', {
      currentChallenge: req.session.currentChallenge,
      webAuthnUserID: req.session.webAuthnUserID
    });

    if (!req.session.currentChallenge) {
      console.error('No challenge found in session');
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
        response,
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
    if (verified && registrationInfo) {
      let user = await getUser(username);
      if (!user) {
        user = await createUser(username);
      }

      const { credential } = registrationInfo;
      const existingDevice = (user.devices as Array<{ credentialID: string }>)?.find((device: { credentialID: string }) => device.credentialID === credential.id);;
      
      const publicKeyToStore = contextBuffer(credential.publicKey);

      if (!existingDevice) {
        const newDevice = {
          credentialPublicKey: publicKeyToStore.toString('base64'),
          credentialID: credential.id,
          counter: credential.counter,
          transports: response.response.transports,
        };
        (user.devices as Array<{ credentialID: string }>)?.push(newDevice);
      }

      await updateUser(user.id, user);

      const webAuthnUserID = req.session.webAuthnUserID;
      await createPasskey({
        passkey_id: credential.id,
        public_key: publicKeyToStore,
        user_id: user.id,
        webauthnUser_id: webAuthnUserID || '',
        counter: BigInt(credential.counter),
        device_type: registrationInfo.credentialDeviceType,
        back_up: registrationInfo.credentialBackedUp,
        devices: user.devices,
      })
      res.cookie('user', JSON.stringify({ id: user.id, name: user.name }), { maxAge: 3600000 });
    }
    req.session.currentChallenge = undefined;
    req.session.webAuthnUserID = undefined;

    res.status(200).send({ verified });
  } catch (error) {
    next(error)
  }
}

export const authenticationStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.body.username;
    const user = await getUser(username);
    if (!user) {
      res.status(404).send(false);
      return;
    }
    
    const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: (user.devices as UserDevices).map((device) => ({
          id: device.credentialID,
          transports: device.transports,
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
    const { assertion } = req.body;
    const user = await getUser(assertion.username);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    if (!req.session.currentChallenge) {
      return res.status(400).send({ error: 'Challenge not found' });
    }

    let dbAuthenticator: WebAuthnCredential | null = null;
    for (const dev of (user.devices as UserDevices)) {
      if (dev.credentialID === assertion.data.id) {
          dbAuthenticator = {
            id: dev.credentialID,
            publicKey: Buffer.from(dev.credentialPublicKey, 'base64'),
            counter: dev.counter,
          };
          break;
      }
    }
    if (!dbAuthenticator) {
      return res.status(400).send({ error: 'Authenticator not found' });
    }

    let verification;
    try {
      const response: AuthenticationResponseJSON = req.body.assertion.data;
      
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
    } catch (error) {
      if(error instanceof Error)
        return res.status(400).send({error: error.message});
      return res.status(500).send(false);
    }
  const {verified} = verification;
  return res.status(200).send(verified);
  }
  catch (error) {
    next(error);
  }
}