"use client";

import { useEffect, useState } from "react";
import type { HealthCheckResponse } from "@ihiga-lite/shared";

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: HealthCheckResponse }
  | { status: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((data: HealthCheckResponse) => setState({ status: "success", data }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-2xl font-semibold">Ihiga Lite</h1>
      <p className="text-sm text-gray-500">Crop advisory chatbot for Rwandan farmers</p>

      <div className="rounded-lg border p-4 font-mono text-sm">
        {state.status === "loading" && <p>Checking API connection…</p>}
        {state.status === "success" && (
          <p>
            status: {state.data.status} | db: {String(state.data.db)}
          </p>
        )}
        {state.status === "error" && <p className="text-red-500">Error: {state.message}</p>}
      </div>
    </main>
  );
}
