import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminContext } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

function safeNext(next: string | undefined): string {
  return next && /^\/admin(\/[A-Za-z0-9/_-]*)?$/.test(next) && next !== "/admin/login" ? next : "/admin";
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const auth = await getAdminContext();
  if (auth.status === "ok") redirect(safeNext(params.next));

  const notice =
    auth.status === "unconfigured"
      ? "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment (see README)."
      : auth.status === "forbidden" || params.error === "forbidden"
        ? "This account does not have administrator access. Sign in with an administrator account."
        : null;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-ivory px-5 py-16">
      <Logo size="lg" href="/" />
      <div className="mt-12 w-full max-w-sm border border-line bg-white p-7 sm:p-9">
        <h1 className="font-serif text-3xl">Admin sign in</h1>
        <p className="mt-2 text-sm text-charcoal/60">Authorised staff only.</p>
        <LoginForm next={safeNext(params.next)} notice={notice} disabled={auth.status === "unconfigured"} />
      </div>
    </main>
  );
}
