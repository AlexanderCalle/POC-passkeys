"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { recoverEmail } from '@/services/auth.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string({
    required_error: "Email is required",
  }).email({ message: "Invalid email" }),
})

const RecoverPage = () => {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      await recoverEmail(values.email)
      
      toast.info("Recover email sent", {
        description: "Please check your email to continue.",
      })
      
      const url = new URL("/recover/verify", window.location.href)
      url.searchParams.set("email", values.email)

      router.push(url.toString())
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
            Enter your email address to recover your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        id="email"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send code"}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RecoverPage