import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button, Field, TextInput } from "@/components/ui";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await authClient.signIn.email({ email, password, callbackURL: "/dashboard" });
    setBusy(false);
    if (result.error) {
      toast.error(result.error.message ?? "Could not sign in");
      return;
    }
    await navigate({ to: "/dashboard" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-4xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Use email or continue with Google or X. The marketplace stays browsable without an account.</p>
        {isPending ? <div className="mt-6 h-40 animate-pulse rounded-xl bg-line" /> : null}
        {!isPending && user ? (
          <p className="mt-6 text-sm">
            You are signed in. <Link to="/dashboard" className="text-primary">Go to your dashboard</Link>
          </p>
        ) : null}
        {!isPending && !user ? (
          <>
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <Field label="Email">
                <TextInput type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </Field>
              <Field label="Password">
                <TextInput type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <div className="my-4 text-center text-xs text-faint">or</div>
            <div className="space-y-2">
              {GROK_PROVIDERS.map((provider) => (
                <Button key={provider.providerId} type="button" variant="ghost" className="w-full" onClick={() => void signIn(provider.providerId, { callbackURL: "/dashboard" })}>
                  Continue with {provider.label}
                </Button>
              ))}
            </div>
            <p className="mt-4 text-sm">
              New here? <Link to="/register" className="font-medium text-primary">Create an account</Link>
            </p>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
