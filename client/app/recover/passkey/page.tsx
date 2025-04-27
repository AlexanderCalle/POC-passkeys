"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { recoverPasskey } from '@/services/auth.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  device_name: z.string({
    required_error: "Device name is required",
  }),
})


export default function RecoverPasskeyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecoverPasskeyContent />
    </Suspense>
  )
}

function RecoverPasskeyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const hash = searchParams.get("hash")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      device_name: "",
    },
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      if (!email || !hash) {
        throw new Error("Email or hash not provided")
      }
      await recoverPasskey(email, hash, values.device_name)

      toast.info("Passkey created", {
        description: "You can now login with your passkey.",
      })
      router.push('/login')
    } catch (error) {
      console.error('Recover failed', error);
      toast.error("Recover failed", {
        description: "Please try again.",
      })
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Account Recovery</CardTitle>
          <CardDescription className="text-center">
            Enter a device name for your new passkey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="device_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="device">Device name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        id="device"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create passkey"}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
