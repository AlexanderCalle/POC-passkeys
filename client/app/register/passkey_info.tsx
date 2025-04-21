import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { KeyRound, Shield, Fingerprint, Lock, Smartphone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PasskeyInfo = ({
  onNext
}: {
  onNext: () => void
}) => {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 max-w-3xl">
      <Button onClick={onNext}  className="mb-2 self-end" variant="secondary">Skip <ArrowRight /></Button>
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Understanding Passkeys</CardTitle>
          <CardDescription className="text-center">
            A modern, secure alternative to passwords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Introduction Section */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">What are Passkeys?</h3>
            <p className="text-muted-foreground">
              Passkeys are a new way to sign in that replaces passwords. They use cryptographic key pairs instead of strings of characters, making them both more secure and easier to use.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">More Secure</h4>
                  <p className="text-sm text-muted-foreground">Resistant to phishing, data breaches, and password attacks</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Fingerprint className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Easier to Use</h4>
                  <p className="text-sm text-muted-foreground">Sign in with your fingerprint, face, or device PIN</p>
                </div>
              </div>
            </div>
          </section>

          {/* How Passkeys Work Section */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">How Passkeys Work</h3>
            <p className="text-muted-foreground">
              Passkeys use public-key cryptography to create a secure connection between you and the services you use.
            </p>
            <ol className="list-decimal list-inside space-y-3 pl-2">
              <li className="text-muted-foreground">
                <span className="font-medium text-foreground">Creation:</span> When you create a passkey, your device generates a unique key pair - a private key that stays on your device and a public key that&apos;s sent to the service.
              </li>
              <li className="text-muted-foreground">
                <span className="font-medium text-foreground">Authentication:</span> When you sign in, the service sends a challenge to your device, which is signed by your private key and verified using the public key.
              </li>
              <li className="text-muted-foreground">
                <span className="font-medium text-foreground">Verification:</span> You verify your identity using biometrics (fingerprint/face) or your device PIN, then you&apos;re signed in securely.
              </li>
            </ol>
          </section>

          {/* Benefits Section */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Benefits of Passkeys</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Lock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Phishing-Resistant</h4>
                  <p className="text-sm text-muted-foreground">Passkeys only work on the legitimate website they were created for, making phishing attacks ineffective.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Cross-Device</h4>
                  <p className="text-sm text-muted-foreground">Passkeys can sync across your devices through iCloud Keychain, Google Password Manager, or other services.</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What happens if I lose my device?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    If your passkeys are synced to the cloud (like iCloud Keychain or Google Password Manager), you can recover them on a new device. Otherwise, you can use account recovery options like email verification to set up a new passkey.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Are passkeys available on all devices?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Passkeys are supported on most modern devices and platforms, including iOS 16+, Android 9+, macOS Ventura+, and Windows 10/11 with compatible browsers like Chrome, Safari, and Edge.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How do I create a passkey?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Setting up a passkey is quick and secure. Here&apos;s how it works:</p>

                    <ol className="list-decimal list-inside space-y-2 pl-2">
                      <li>Click the &quot;Register a passkey&quot; button during account creation or login</li>
                      <li>On your phone:
                        <ul className="list-disc list-inside pl-4 pt-1">
                          <li>You&apos;ll be prompted to scan a QR code with your phone&apos;s camera</li>
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={onNext}>Next</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default PasskeyInfo
