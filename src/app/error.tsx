"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center px-6 py-20 text-center">
      <Monogram className="h-14 w-14 text-champagne-dark" />
      <h1 className="display-2 mt-8">Something went wrong</h1>
      <p className="body-lg mt-4 max-w-md">Please try again. If the problem continues, contact us on WhatsApp.</p>
      <div className="mt-10 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Home
        </Link>
      </div>
    </main>
  );
}
