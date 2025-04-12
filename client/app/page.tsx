"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { fido2Create, fido2Get } from "@ownid/webauthn"
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
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

      const fidoData = await fido2Create(publicKey, username);

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
        router.push('/dashboard');
      } else {
        setError('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        setError(error.message);
      }
      setError('Registration failed');
    }
  };

  const handleLogin = async () => {
    const response = await fetch('http://localhost:3001/login/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', 
      body: JSON.stringify({ username: username })
    }).then(res => res.json())
      .catch(err => {
        setError('Login failed');
        console.error(err);
      });
    const optionsJSON = response as PublicKeyCredentialRequestOptionsJSON;     
    try {
      const assertion = await fido2Get(optionsJSON, username);
      const loginResponse = await fetch('http://localhost:3001/login/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({assertion})
      }).then(res => res.json());
      
      if (loginResponse) {
        router.push('/dashboard');
      } else {
        setError('Login failed');
      }
    } catch {
      setError('Authentication failed');
    }
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
