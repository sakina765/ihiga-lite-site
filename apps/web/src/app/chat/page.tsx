import type { Metadata } from "next";
import { ChatGate } from "../../components/chat/ChatGate";

export const metadata: Metadata = {
  title: "Ihiga — Chat",
  description: "Ask Ihiga about your crops",
};

export default function ChatPage() {
  return <ChatGate />;
}
