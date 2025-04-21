import { User } from "@prisma/client";
import { getUser } from "../services/user.service";
import { createPasskey, getUserPaskeys } from "../services/passkey.service";
import { generateRegistrationOptions, GenerateRegistrationOptionsOpts, RegistrationResponseJSON, verifyRegistrationResponse } from "@simplewebauthn/server";
import config from "../config/config";
import { generateToken } from "../controllers/auth.controller";

export const contextBuffer = (buffer: Uint8Array) => Buffer.from(buffer);

export const generateRegistration = async (user: User) => {
  try {
    const passkeys = await getUserPaskeys(user);

    const pubKey: GenerateRegistrationOptionsOpts = {
      rpName: config.relyingPartyName,
      rpID: config.replyingPartyId,
      userName: user.username,
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

    return await generateRegistrationOptions(pubKey);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const verifyRegistrationOptions = async (data: {
  username: string;
  deviceName: string;
  currentChallenge: string;
  response: RegistrationResponseJSON;
  webAuthnUserID: string;
}, callback: () => Promise<User>) => {
  try {
  const { username, deviceName, currentChallenge, response } = data;
    let verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: currentChallenge,
      expectedOrigin: config.origin,
    });
    
    const { verified, registrationInfo } = verification;
    let token: string = '';
    if(verified && registrationInfo) {
      const { credential } = registrationInfo;
      const publicKeyToStore = contextBuffer(credential.publicKey);

      const user = await callback();

      await createPasskey({
        passkey_id: credential.id,
        public_key: publicKeyToStore,
        name: deviceName,
        user_id: user.id,
        webauthnUser_id: data.webAuthnUserID || '',
        counter: BigInt(credential.counter),
        device_type: registrationInfo.credentialDeviceType,
        back_up: registrationInfo.credentialBackedUp,
      })

      token = await generateToken({ id: user.id, name: user.name });

    }
    return { verified, token };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

