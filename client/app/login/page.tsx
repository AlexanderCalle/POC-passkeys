"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";
import { login, register } from "@/services/auth.service";
import "../globals.css";

export default function Home() {
  const [username, setUsername] = useState("");
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

  const handleLogin = async () => {
    try {
      await login(username);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      setError('Login failed');
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
        }}>
          <Key />
          Signin
        </Button>
        <span className="text-red-500">{error}</span>
      </form>
    </div>
  );
}
