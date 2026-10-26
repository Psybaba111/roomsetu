import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button, TextArea } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMessages, sendMessage } from "@/lib/roomsetu/account-api";

export const Route = createFileRoute("/messages/$id")({
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const { user } = useCurrentUserState();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getMessages>>>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = () => {
      void getMessages({ data: id }).then(setRows).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load"));
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [user, id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await sendMessage({ data: { conversationId: id, body } });
      setBody("");
      setRows(await getMessages({ data: id }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send");
    }
  }

  return (
    <AppShell>
      <Link to="/messages" className="text-sm text-primary">All messages</Link>
      <h1 className="mt-2 font-display text-4xl">Conversation</h1>
      <div className="mt-4 space-y-2">
        {rows.map((message) => {
          const mine = message.senderId === user?.id;
          return (
            <div key={message.id} className={`max-w-lg rounded-lg border border-line px-3 py-2 text-sm ${mine ? "ml-auto bg-primary-soft" : "bg-surface"}`}>
              <p>{message.body}</p>
              <p className="mt-1 text-xs text-faint">{message.createdAt.slice(0, 16).replace("T", " ")}</p>
            </div>
          );
        })}
      </div>
      <form onSubmit={onSubmit} className="mt-4 max-w-lg space-y-2">
        <TextArea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message" />
        <Button type="submit">Send</Button>
      </form>
    </AppShell>
  );
}
