
declare module 'express-session' {
  interface SessionData {
    currentChallenge: string;
    webAuthnUserID: string;
  }
}