import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { IntroGate } from "../components/IntroGate";
import { LanguageProvider } from "../i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Ihiga Lite",
  description: "Crop advisory chatbot for Rwandan farmers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reading the nonce here isn't just for our own use — calling headers()
  // in a Server Component is what makes Next.js apply the same nonce
  // (set on the response's CSP header by middleware.ts) to the framework's
  // own inline/streamed <script> tags. Skip this call and CSP silently
  // blocks the entire app's scripts in production (verified: it did).
  // This also opts the layout out of static prerendering, which a
  // per-request nonce requires anyway.
  headers().get("x-nonce");

  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <IntroGate>{children}</IntroGate>
        </LanguageProvider>
      </body>
    </html>
  );
}
