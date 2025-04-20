"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRight, KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { toast } from "sonner"
import { recoverEmail, verifyOTP } from "@/services/auth.service"

const formSchema = z.object({
  otp: z.string().min(6, {
    message: "Your one-time password must be 6 digits.",
  }),
})

export default function VerifyOTPPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams();

  const email = searchParams.get("email")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      if (!email) {
        throw new Error("Email not provided")
      }
      // TODO: Replace this with your actual verification logic
      // This would be replaced with your actual API call
      await verifyOTP(searchParams.get("email")!, values.otp)

      // Simulate successful verification
      toast.info("Account recovered successfully",
        {
          description: "You will be redirected to register your passkey.",
        },
      )

      // TODO: redirect to passkey registration
      // // Redirect to password reset page
      // setTimeout(() => {
      //   router.push("/reset-password")
      // }, 1500)
    } catch(error) {
      if(error instanceof Error) {
        toast.error("Verification failed", {
          description: error.message,
        })
        return;
      } else {
        console.error("Verification failed", error);
        toast.error("Verification failed", {
          description: "The code you entered is invalid or has expired. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resendCode = async () => {
    if (email) {
      await recoverEmail(email)
      toast.info("Recover email sent", {
        description: "Please check your email to continue.",
      })
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
            Enter the 6-digit code we sent to your email or phone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Didn&apos;t receive a code?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={resendCode}>
              Resend code
            </Button>
          </div>
          <div className="text-sm text-center text-muted-foreground">
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/login")}>
              Return to login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
