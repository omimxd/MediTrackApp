import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-6">
      <div className="w-full max-w-sm">
        <Card className="border-teal-100">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <CheckCircle2 className="h-8 w-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl text-teal-900">Check your email</CardTitle>
            <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-sm text-muted-foreground">
              Please check your email and click the confirmation link to activate your account.
            </p>
            <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
