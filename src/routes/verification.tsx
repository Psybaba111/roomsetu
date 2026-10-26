import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Badge, Button, Field, Panel, TextArea } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, submitVerification } from "@/lib/roomsetu/account-api";

export const Route = createFileRoute("/verification")({
  component: VerificationPage,
});

const checks = [
  ["identity", "Identity", "A note for manual review. Do not upload a government ID in this prototype."],
  ["property", "Property", "Describe the address proof you would share with a reviewer."],
  ["phone", "Phone", "OTP is not connected. Submitting queues the number for review."],
  ["email", "Email", "Email delivery is not connected. Submitting queues a manual check."],
] as const;

function VerificationPage() {
  const { user, isPending } = useCurrentUserState();
  const [status, setStatus] = useState("unverified");
  const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<(typeof checks)[number][0]>("identity");

  useEffect(() => {
    if (!user) return;
    void ensureProfile({ data: { fullName: user.displayName ?? "", email: user.primaryEmail ?? "" } }).then((profile) => {
      if (profile) setStatus(profile.verificationStatus);
    });
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await submitVerification({ data: { kind, notes, listingId: "" } });
      setStatus("pending");
      toast.success("Sent for review");
      setNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit");
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Verification</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">A verified badge appears only after an admin approves a request. Submitting a form does not make you verified.</p>
      {isPending ? <div className="mt-6 h-16 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? <p className="mt-4"><Link to="/login" className="text-primary">Sign in</Link></p> : null}
      {user ? (
        <>
          <div className="mt-4"><Badge tone={status === "verified" ? "good" : "warn"}>{status}</Badge></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {checks.map(([id, title, body]) => (
              <button key={id} type="button" onClick={() => setKind(id)} className={`rounded-xl border p-4 text-left ${kind === id ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="mt-4 max-w-xl">
            <Field label="Note for the reviewer">
              <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Button className="mt-3" type="submit">Submit for review</Button>
          </form>
          <Panel className="mt-6">
            <p className="text-sm">Checklist a reviewer looks at: identity, address, photographs, occupancy, phone, email. Documents are not stored as files in this build.</p>
          </Panel>
        </>
      ) : null}
    </AppShell>
  );
}
