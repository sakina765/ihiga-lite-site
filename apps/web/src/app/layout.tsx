import type { Metadata } from "next";
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
