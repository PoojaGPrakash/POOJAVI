"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="border border-[#9b2c2c]/25 bg-white p-8 text-center">
      <h1 className="font-serif text-2xl">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-charcoal/65">{error.message || "An unexpected error occurred."}</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
