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
    if(response === true) {
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
    const optionsJSON = response as PublicKeyCredentialRequestOptionsJSON; 

    console.log(optionsJSON);
    
    try {
      const assertion = await fido2Get(optionsJSON, username);
      const loginResponse = await fetch('http://localhost:3001/login/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({assertion})
      }).then(res => res.json());
      
      if (loginResponse) {
        console.log('Login successful');
        router.push('/dashboard');
      } else {
        setError('Login failed');
      }
    } catch (err) {
      console.error(err);
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