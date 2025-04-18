import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

type UserDevice = { 
  id: string;
  credentialPublicKey: string;
  counter: number;
  transports: AuthenticatorTransport[];
};


export const register = async (username: string) => {
  try {
    const startResponse = await fetch('http://localhost:3001/api/auth/register/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username })
    });

    if (!startResponse.ok) {
      throw new Error(`HTTP error! status: ${startResponse.status}`);
    }

    const publicKey = await startResponse.json();

    if(publicKey.excludeCredentials) {
      publicKey.excludeCredentials = publicKey.excludeCredentials.map((cred: UserDevice) => {
        return {
          ...cred,
          id: new Uint8Array(Buffer.from(cred.id, 'base64'))
        };
      });
    }

    const fidoData = await startRegistration(publicKey);

    // Complete registration
    const response = await fetch('http://localhost:3001/api/auth/register/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(fidoData)
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    });

    if (response.verified) {
      return true;
    } else {
      throw new Error("Registration failed");
    }
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Registration failed');
  }
}

export const login = async (username: string) => {
  const response = await fetch('http://localhost:3001/api/auth/login/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', 
    body: JSON.stringify({ username: username })
  }).then(res => res.json())

  const optionsJSON = response;     
  try {
    if(optionsJSON.allowCredentials) {
      optionsJSON.allowCredentials = optionsJSON.allowCredentials?.map((cred: UserDevice) => ({
        ...cred,
        id: cred.id,
      }));
    }

    const assertion = await startAuthentication(optionsJSON);
    const loginResponse = await fetch('http://localhost:3001/api/auth/login/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({assertion, username})
    }).then(res => res.json());
    
    if (loginResponse === true) {
      return;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Authentication failed', error);
    throw new Error('Authentication failed');
  }
}