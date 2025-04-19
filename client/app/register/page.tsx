"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { register } from '@/services/auth.service';
import { Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const RegistrationPage = () => {
  const [username, setUsername] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await register(username);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed', error);
      setError('Registration failed');
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
        <label htmlFor="device-name">Device name</label>
        <Input
          id="device-name"
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />
        <Button type="button" variant="default" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRegister();
        }}>
          <Key />
          Register passkey
        </Button>
        <span className="text-red-500">{error}</span>
      </form>
    </div>
  )
}

export default RegistrationPage