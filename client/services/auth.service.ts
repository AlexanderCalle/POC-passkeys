import { deleteSession, getSession, setSession } from "@/lib/session";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

type UserDevice = { 
  id: string;
  credentialPublicKey: string;
  counter: number;
  transports: AuthenticatorTransport[];
};


export const register = async (userInfo: {
  username: string;
  name?: string;
  email: string;
  deviceName: string;
}) => {
  const { username, name, email, deviceName } = userInfo;
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
          id: cred.id
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
      body: JSON.stringify({username, name, email, deviceName, data: fidoData})
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    });

    if (response.verified) {
      setSession(response.token, new Date(Date.now() + 3600000));
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
  }).then(res => {
    if (!res.ok) {
      if(res.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })

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
    
    if (loginResponse.verified === true) {
      setSession(loginResponse.token, new Date(Date.now() + 3600000));
      return;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Authentication failed', error);
    throw new Error('Authentication failed');
  }
}

export const createNewDevice = async (userInfo: {
  username: string;
  deviceName: string;
}) => {
  const { username, deviceName } = userInfo;
  try {
    const session = await getSession();
    const startResponse = await fetch('http://localhost:3001/api/passkeys/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.value}`,
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
          id: cred.id
        };
      });
    }

    const fidoData = await startRegistration(publicKey);
    // Complete registration
    const response = await fetch('http://localhost:3001/api/passkeys/new/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.value}`,
      },
      credentials: 'include',
      body: JSON.stringify({username, name, deviceName, data: fidoData})
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

export const recoverEmail = async (email: string) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return "OTP sent to email";
  } catch (error) {
    console.error('Recover error:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Recover failed');
  }
}

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/recover/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, otp })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if(errorData.error) {
        throw new Error(errorData.error);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.hash;
  } catch (error) {
    console.error('Verify OTP error:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Verify OTP failed');
  }
}

export const recoverPasskey = async (email: string, hash: string, deviceName: string) => {
  try {

    const startResponse = await fetch('http://localhost:3001/api/passkeys/recover/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, hash })
    });

    if (!startResponse.ok) {
      throw new Error(`HTTP error! status: ${startResponse.status}`);
    }

    const publicKey = await startResponse.json();
    if(publicKey.excludeCredentials) {
      publicKey.excludeCredentials = publicKey.excludeCredentials.map((cred: UserDevice) => {
        return {
          ...cred,
          id: cred.id
        };
      });
    }

    const fidoData = await startRegistration(publicKey);
    // Complete registration
    const response = await fetch('http://localhost:3001/api/passkeys/recover/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({email, deviceName, data: fidoData})
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
    console.error('Recover passkey error:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Recover passkey failed');
  }
}

export const logout = async () => {
  await deleteSession();
  window.location.reload();
}