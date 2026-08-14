import { AuthForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const checkEmail = params.checkEmail === "1";
  const authError = params.error === "auth";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <Brand />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          {checkEmail && (
            <p className="mb-4 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
              Check your email to confirm your account, then sign in.
            </p>
          )}
          {authError && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              That sign-in link was invalid or expired. Try again.
            </p>
          )}
          <AuthForm mode="login" />
        </CardContent>
      </Card>
    </main>
  );
}
