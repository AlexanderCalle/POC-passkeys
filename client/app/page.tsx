"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { fido2Create, fido2Get } from "@ownid/webauthn";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    const publicKey = await fetch('http://localhost:3001/register/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username })
    }).then(res => res.json());
    console.log(publicKey);
    const fidoData = await fido2Create(publicKey, username);
    const response = await fetch('http://localhost:3001/register/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fidoData)
    }).then(res => res.json());
    if(response) {
      router.push('/dashboard');
    }
    else {
      setError('Registration failed');
    }
  };

  const handleLogin = async () => {
    const response = await fetch('http://localhost:3001/login/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username })
    }).then(res => res.json())
      .catch(err => {
        setError('Login failed');
        console.error(err);
      });
    console.log('Server response:', response);
    console.log('Challenge format:', typeof response.challenge, response.challenge);
    const challenge = base64urlToUint8Array(response.challenge);
    const options = {...response, challenge: challenge} as PublicKeyCredentialRequestOptions;
    const assertion = await fido2Get(options, username);
    await fetch('http://localhost:3001/login/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assertion)
    }).then(res => res.json());
    console.log('Login successful');
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold">Passkeys POC</h1>
      <form className="flex flex-col gap-4" onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}>
        <label htmlFor="username">Username</label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRegister();
        }}>Register</Button>
        <Button type="button" variant="default" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleLogin();
        }}>Submit</Button>
        <span className="text-red-500">{error}</span>
      </form>
    </div>
  );
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  try {
    // Remove any whitespace
    base64url = base64url.trim();
    
    // Step 1: Convert base64url to base64
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/\s/g, '');

    // Step 2: Add padding if necessary
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;

    // Step 3: Decode base64 to binary string
    const binaryString = window.atob(paddedBase64);

    // Step 4: Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error decoding base64url:', error);
    console.error('Input string:', base64url);
    throw error;
  }
}