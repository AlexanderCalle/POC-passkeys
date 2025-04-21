"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";
import { login } from "@/services/auth.service";
import "../globals.css";
import Link from "next/link";

export default function Home() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login(username);
      router.push('/dashboard');
    } catch (error) {

      console.error('Login failed', error);
      if(error instanceof Error) {
        setError(error.message ?? 'Login failed');
        return;
      }
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
        <Button type="button" variant="default" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleLogin();
        }}>
          <Key />
          Signin with passkey
        </Button>
        <Link href="/register" className="text-blue-500 hover:underline">No account yet? Create an account.</Link>
        <Link href="/recover" className="text-blue-500 hover:underline">Lost your passkey?</Link>
        <span className="text-red-500">{error}</span>
      </form>
    </div>
  );
}
