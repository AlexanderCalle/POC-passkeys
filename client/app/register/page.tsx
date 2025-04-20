"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { register } from '@/services/auth.service';
import { Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Stepper } from '@/components/stepper';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const schema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email' }),
  deviceName: z.string().min(1, { message: 'Device name is required' }),
});

const RegistrationPage = () => {

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      deviceName: "",
    },
  });
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);

  const onSubmit = async (value: z.infer<typeof schema>) => {
    try {
      await register(value);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed', error);
      form.setError("root", { message: 'Registration failed' });
    }
  };
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Stepper
        items={[
          { title: 'Information', active: currentStep >= 0 },
          { title: 'Passkey setup', active: currentStep >= 1 },
        ]}
      />
      <Form {...form}>
        {currentStep === 0 && (
          <form className="flex flex-col gap-4" onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentStep((prev) => prev + 1);
          }}>
            <FormMessage />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='john_doe'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Set a name for your account, this will be linked to your passkey.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='john_doe@example.com'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Set a email for your account, this will be used to recover your account.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='John Doe'
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">
              Next
            </Button>
          </form>
        )}
        {currentStep === 1 && (
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormMessage />
            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='My Phone'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Set a name for your device, this will be linked to your passkey.
                    <br />
                    Makes it easier to manage your passkeys.
                  </FormDescription>
                </FormItem>
              )}
            />
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>How to register a passkey?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Setting up a passkey is quick and secure. Here&apos;s how it works:</p>
                    
                    <ol className="list-decimal list-inside space-y-2 pl-2">
                      <li>Click the &quot;Register a passkey&quot; button below</li>
                      <li>On your phone:
                        <ul className="list-disc list-inside pl-4 pt-1">
                          <li>You&apos;ll be prompted to scan a QR code with your phone &apos; s camera</li>
                          <li>This connects your phone securely to this registration</li>
                        </ul>
                      </li>
                      <li>Follow your phone&apos;s prompts:
                        <ul className="list-disc list-inside pl-4 pt-1">
                          <li>Use your fingerprint, face recognition, or PIN to confirm</li>
                          <li>This creates your passkey securely on your device</li>
                        </ul>
                      </li>
                      <li>That&apos;s it! Your passkey is now set up and ready to use for future logins</li>
                    </ol>

                    <p className="pt-2">
                      <strong>Note:</strong> Your passkey is securely stored on your device and never leaves it. 
                      Only a verification code is sent to our servers.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button type="button" variant="secondary" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentStep((prev) => prev - 1);
            }}>
              Back
            </Button>
            <Button type="submit">
              <Key />
              Register a passkey
            </Button>
          </form>
        )}
      </Form>
    </div>
  )
}

export default RegistrationPage
