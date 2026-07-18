import type { Metadata } from "next";
import { HomePage } from "../components/home/HomePage";

const DESCRIPTION =
  "Ihiga Lite is an AI crop advisory chatbot for Rwandan farmers — season- and weather-aware advice, tracked to your crop's actual growth stage, in English, Kinyarwanda, or French, by text, voice, or photo.";

export const metadata: Metadata = {
  title: "Ihiga Lite — AI Insights for Better Farming",
  description: DESCRIPTION,
  openGraph: {
    title: "Ihiga Lite — AI Insights for Better Farming",
    description: DESCRIPTION,
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ihiga Lite — AI Insights for Better Farming",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <HomePage />;
}
