import type { Metadata } from "next";
import { ChatWidget } from "../../components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "Ihiga — Chat",
  description: "Ask Ihiga about your crops",
};

export default function ChatPage() {
  return <ChatWidget />;
}
