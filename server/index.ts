import express, { response, type Request, type Response, type RequestHandler } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { verifyRegistrationResponse, generateRegistrationOptions, verifyAuthenticationResponse, generateAuthenticationOptions, type GenerateRegistrationOptionsOpts, type GenerateAuthenticationOptionsOpts } from '@simplewebauthn/server';
import base64url from 'base64url';
import crypto from 'crypto';

require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

interface User {
  username: string;
  registrationInfo: any;
}

let users: Record<string, any> = {};

type Challenge = {
  [key: string]: string;
}
let challenges: Challenge = {};

const relying_party_id = 'localhost';
const expected_origin = 'http://localhost:3000';

/**
 * Initiates the registration process by generating a challenge and returning public key credential creation options
 */
app.post('/register/start', async (req, res) => {
  console.log(req.body)
  const username = req.body.username;
  const pubKey: GenerateRegistrationOptionsOpts = {
    rpName: 'webauthn-app',
    rpID: relying_party_id,
    userName: username,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'preferred',
    },
    supportedAlgorithmIDs: [-7, -257],
  };

  const options = await generateRegistrationOptions(pubKey);
  challenges[username] = convertChallenge(options.challenge);
  res.json(options);
})

app.post('/register/finish', (async (req: Request, res: Response) => {
  const { username, data: response } = req.body;

  console.log("finish - register"); 
  // Verification
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenges[username],
      expectedOrigin: expected_origin,
    });
  } catch (error) {
    console.error(error);
    if(error instanceof Error) {
      return res.status(400).send({error: error.message});
    }
    return res.status(500).send(false);
  }
  if(!verification) {
    return res.status(500).send(false);
  }

  const {verified, registrationInfo} = verification;
  if (verified) {
    users[username] = registrationInfo;
    return res.status(200).send(true);
  }
  return res.status(500).send(false);
}) as unknown as RequestHandler);

// @ts-ignore
app.post('/login/start', async (req, res) => {
    let username = req.body.username;
    if (!users[username]) {
        return res.status(404).send(false);
    }
    const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: [{
            id: username,
            transports: ['internal'],
        }],
        userVerification: 'preferred',
        rpID: relying_party_id,
    };
    const options = await generateAuthenticationOptions(opts);
    challenges[username] = convertChallenge(options.challenge);
    res.json(options);
});

//@ts-ignore
app.post('/login/finish', async (req, res) => {
    let username = req.body.username;
    if (!users[username]) {
       return res.status(404).send(false);
    }
    let verification;
    try {
        const user = users[username];
        verification = await verifyAuthenticationResponse({
            expectedChallenge: challenges[username],
            response: req.body.data,
            authenticator: user,
            expectedRPID: relying_party_id,
            expectedOrigin: expected_origin,
            requireUserVerification: false
        } as any);
    } catch (error) {
        console.error(error);
        if(error instanceof Error)
          return res.status(400).send({error: error.message});
        return res.status(500).send(false);
    }
    const {verified} = verification;
    return res.status(200).send({
        res: verified
    });
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});

function getNewChallenge() {
  return Math.random().toString(36).substring(2);
}
function convertChallenge(challenge: Uint8Array | string): string {
  if (typeof challenge === 'string') {
    // If it's already a string, encode it to base64url
    return base64url.encode(Buffer.from(challenge));
  }
  // If it's a Uint8Array, convert it to base64url
  return base64url.encode(Buffer.from(challenge));
}
