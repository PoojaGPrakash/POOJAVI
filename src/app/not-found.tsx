import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-ivory px-6 py-20 text-center">
      <Logo size="md" />
      <Monogram className="mt-16 h-14 w-14 text-champagne-dark" />
      <p className="eyebrow mt-8">Page not found</p>
      <h1 className="display-2 mt-4">This thread has come loose</h1>
      <p className="body-lg mt-5 max-w-md">The page you are looking for may have moved or is no longer available.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Return home
        </Link>
        <Link href="/collections" className="btn-outline">
          Explore collections
        </Link>
      </div>
    </main>
  );
}
