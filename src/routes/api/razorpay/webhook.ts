import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRazorpayWebhook } = await import("@/lib/roomsetu/payments.server");
        const raw = await request.text();
        return handleRazorpayWebhook(raw, request.headers.get("x-razorpay-signature"));
      },
    },
  },
});
