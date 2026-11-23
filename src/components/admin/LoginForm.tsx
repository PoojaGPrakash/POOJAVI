"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { FieldError } from "@/components/ui/FieldError";

export function LoginForm({ next, notice, disabled }: { next: string; notice: string | null; disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const busy = pending || isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (authError) {
      setError(authError.status === 400 ? "Incorrect email or password." : authError.message);
      return;
    }
    startTransition(() => {
      router.replace(next);
      router.refresh();
    });
  });

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      {notice && (
        <p role="alert" className="border border-amber-700/25 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          {notice}
        </p>
      )}
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" type="email" autoComplete="username" className="field-input" disabled={disabled} aria-invalid={Boolean(errors.email)} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            className="field-input pr-11"
            disabled={disabled}
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-charcoal/50 hover:text-charcoal">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError message={errors.password?.message} />
      </div>
      {error && (
        <p role="alert" className="border border-[#9b2c2c]/30 bg-[#9b2c2c]/5 px-3 py-2.5 text-sm text-[#9b2c2c]">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy || disabled}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
