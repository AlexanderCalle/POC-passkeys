"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";
import { login } from "@/services/auth.service";
import "../globals.css";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
});

export default function Home() {
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });
  
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    try {
      await login(values.username);
      router.push('/dashboard');
    } catch (error) {
      if(error instanceof Error) {
        setError(error.message ?? 'Login failed, please try again.');
        return;
      }
      setError('Login failed, please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
     <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-2xl font-bold text-center">Medi Dashboard - Signin</h1>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleLogin)}>
            <FormDescription>Signin with your passkey</FormDescription>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="username"
                      placeholder="john_doe"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" variant="default">
              <Key />
              Signin with passkey
            </Button>
            <p>No account yet? <Link href="/register" className="text-blue-500 hover:underline">Create an account.</Link></p>
            <Link href="/recover" className="text-blue-500 hover:underline">Lost your passkey?</Link>
            <span className="text-red-500">{error}</span>
          </form>
        </Form>
      </CardContent>
     </Card>
    </div>
  );
}
