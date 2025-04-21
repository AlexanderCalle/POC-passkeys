# Technical Analysis of Passkey Authentication Implementation

## 1. Architecture Overview

The application implements a WebAuthn-based passkey authentication system with the following components:

- **Backend**: Node.js/Express server with TypeScript
- **Frontend**: Next.js client application
- **Database**: SQLite via Prisma ORM
- **Key Libraries**: 
  - `@simplewebauthn/server` for server-side WebAuthn operations
  - `@simplewebauthn/browser` for client-side WebAuthn operations

## 2. Authentication Flows

### 2.1 Registration Flow

1. **Initiation**:
   - Client calls `/api/auth/register/start` with username
   - Server generates registration options using `generateRegistrationOptions()`
   - Challenge is stored in session (`req.session.currentChallenge`)
   - WebAuthn user ID is stored in session (`req.session.webAuthnUserID`)

2. **Client Processing**:
   - Client receives registration options
   - Client calls `startRegistration()` from `@simplewebauthn/browser`
   - Platform authenticator creates a new key pair
   - Client sends attestation response to server

3. **Verification**:
   - Server verifies attestation with `verifyRegistrationResponse()`
   - Server checks expected challenge and origin
   - Server stores credential ID, public key, and metadata in database
   - JWT token is generated and returned to client

```typescript
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
```

### 2.2 Authentication Flow

1. **Initiation**:
   - Client calls `/api/auth/login/start` with username
   - Server retrieves user's passkeys
   - Server generates authentication options with `generateAuthenticationOptions()`
   - Challenge is stored in session

2. **Client Processing**:
   - Client receives authentication options
   - Client calls `startAuthentication()` from `@simplewebauthn/browser`
   - Platform authenticator signs the challenge
   - Client sends assertion to server

3. **Verification**:
   - Server verifies assertion with `verifyAuthenticationResponse()`
   - Server checks expected challenge, origin, and RP ID
   - Server verifies signature using stored public key
   - JWT token is generated and returned to client

```typescript
export const verifyAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assertion, username } = req.body;
    const user = await getUser(username);
    const passkeys = await getUserPaskeys(user);
    
    // ...

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
```

### 2.3 Account Recovery Flow

1. **OTP Generation**:
   - User requests OTP via email
   - Server generates OTP and stores in Redis with 5-minute expiry
   - OTP is sent to user's email

2. **OTP Verification**:
   - User submits OTP
   - Server verifies OTP against stored value
   - Server generates a hash from OTP and stores it in Redis with 10-minute expiry

3. **Passkey Recovery**:
   - User submits hash and device name
   - Server verifies hash and retrieves user
   - Server initiates passkey registration flow
   - New passkey is created and associated with user

## 3. Security Analysis

### 3.1 Strengths

1. **Phishing Resistance**: 
   - Origin validation ensures credentials can only be used on legitimate domains
   - Challenge-response mechanism prevents replay attacks

2. **Credential Management**:
   - Passkeys are stored securely on user devices
   - Public keys are stored server-side, private keys never leave the device
   - Multiple passkeys per user are supported

3. **Recovery Mechanism**:
   - Email-based OTP recovery provides a fallback method
   - OTP has short expiry time (5 minutes)
   - Recovery hash has slightly longer expiry (10 minutes)

4. **Session Security**:
   - HttpOnly cookies for session management
   - SameSite=Lax cookie policy
   - JWT for authenticated API requests

### 3.2 Potential Weaknesses

1. **User Verification**:
   - `userVerification` is set to 'preferred' rather than 'required'
   - `requireUserVerification` is set to `false` during authentication

2. **Session Management**:
   - Session secrets are using default values in development
   - No explicit CSRF protection beyond SameSite cookies

3. **Error Handling**:
   - Some error responses expose internal details (e.g., session data)
   - Inconsistent error response formats

4. **Passkey Deletion Protection**:
   - While there's a check to prevent deleting the last passkey, it's not atomic

## 4. Data Storage

### 4.1 Passkey Storage

The `PassKey` model in the database stores:

- `passkey_id`: Credential ID from WebAuthn
- `public_key`: Public key as binary data
- `user_id`: Foreign key to User
- `webauthnUser_id`: WebAuthn user ID
- `counter`: Signature counter for replay detection
- `device_type`: Authenticator transport type
- `back_up`: Whether the credential is backed up
- `name`: User-friendly device name

```typescript
model PassKey {
  id              Int     @id @default(autoincrement())
  name            String?
  passkey_id      String
  public_key      Bytes
  user_id         Int
  user            User    @relation(fields: [user_id], references: [id])
  webauthnUser_id String
  counter         BigInt
  device_type     String
  back_up         Boolean

  @@map(name: "passkeys")
}
```

### 4.2 Temporary Storage

- Redis is used for temporary storage of OTPs and recovery hashes
- Session data is stored server-side with express-session

## 5. WebAuthn Configuration

### 5.1 Registration Options

- `attestationType`: Set to 'none' (no attestation required)
- `residentKey`: Set to 'required' (discoverable credentials)
- `userVerification`: Set to 'preferred' (biometric/PIN encouraged but not required)
- `supportedAlgorithmIDs`: Supports ES256 (-7) and RS256 (-257)
- `timeout`: 60 seconds

```typescript
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
```

### 5.2 Authentication Options

- `userVerification`: Set to 'preferred'
- `rpID`: Configured from environment or defaults to 'localhost'
- `timeout`: 60 seconds

## 6. Client-Side Implementation

The client uses `@simplewebauthn/browser` to handle WebAuthn operations:

- `startRegistration()` for credential creation
- `startAuthentication()` for assertion generation

The client properly handles the binary data conversion required for WebAuthn:

```typescript
export const login = async (username: string) => {
  // ...
  if(optionsJSON.allowCredentials) {
    optionsJSON.allowCredentials = optionsJSON.allowCredentials?.map((cred: UserDevice) => ({
      ...cred,
      id: cred.id,
    }));
  }

  const assertion = await startAuthentication(optionsJSON);
  // ...
}
```

## 7. User Experience Considerations

1. **Device Management**:
   - Users can name their passkeys
   - Users can see which passkeys are backed up
   - Users can delete passkeys (with protection against deleting the last one)

2. **Recovery Flow**:
   - Email-based recovery with OTP
   - Clear error messages for expired OTPs

3. **Registration UX**:
   - Step-by-step registration process
   - Explanatory text about passkeys

## 8. Recommendations for Improvement

1. **Security Enhancements**:
   - Set `userVerification` to 'required' for stronger security
   - Implement CSRF tokens for form submissions
   - Add rate limiting for OTP requests
   - Use more secure default values for secrets

2. **Error Handling**:
   - Standardize error response format
   - Avoid exposing internal details in error responses
   - Add more detailed logging for debugging

3. **UX Improvements**:
   - Add visual indicators during WebAuthn operations
   - Provide more feedback about passkey status
   - Implement progressive enhancement for browsers without WebAuthn support

4. **Code Structure**:
   - Refactor duplicate code between registration flows
   - Add more comprehensive input validation
   - Implement atomic operations for critical functions

## 9. Conclusion

The implementation provides a solid foundation for passkey-based authentication with proper security considerations. It follows WebAuthn best practices for credential creation and verification, with appropriate session management and recovery mechanisms. The main areas for improvement are around user verification requirements, error handling consistency, and some UX enhancements.

The system effectively demonstrates the core benefits of passkeys: phishing resistance, improved user experience, and reduced reliance on passwords.
