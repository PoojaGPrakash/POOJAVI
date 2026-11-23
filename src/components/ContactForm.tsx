"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { contactSchema, type ContactInput } from "@/lib/validation/schemas";
import { submitContactEnquiry } from "@/lib/actions/contact";
import { FieldError } from "@/components/ui/FieldError";

export function ContactForm({ productId, defaultSubject }: { productId?: string; defaultSubject?: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: defaultSubject ?? "", message: "", product_id: productId ?? "", website: "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (pending) return;
    setResult(null);
    startTransition(async () => {
      const res = await submitContactEnquiry(values);
      if (res.ok) {
        setResult({ ok: true, message: res.message ?? "Thank you." });
        reset({ name: "", email: "", phone: "", subject: "", message: "", product_id: "", website: "" });
      } else {
        for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof ContactInput, { message: messages[0] });
        }
        setResult({ ok: false, message: res.error });
      }
    });
  });

  if (result?.ok) {
    return (
      <div role="status" className="flex flex-col items-center border border-line bg-white/60 px-6 py-14 text-center">
        <CheckCircle2 className="mb-5 h-10 w-10 text-burgundy" strokeWidth={1} />
        <h2 className="heading-3">Message sent</h2>
        <p className="body-lg mt-3 max-w-sm">{result.message}</p>
        <button type="button" className="btn-outline mt-8" onClick={() => setResult(null)}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-6" aria-describedby={result ? "contact-result" : undefined}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">
            Name *
          </label>
          <input id="c-name" autoComplete="name" className="field-input" aria-invalid={Boolean(errors.name)} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="c-email" className="field-label">
            Email *
          </label>
          <input id="c-email" type="email" autoComplete="email" inputMode="email" className="field-input" aria-invalid={Boolean(errors.email)} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="c-phone" className="field-label">
            Phone / WhatsApp
          </label>
          <input id="c-phone" type="tel" autoComplete="tel" inputMode="tel" className="field-input" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <label htmlFor="c-subject" className="field-label">
            Subject
          </label>
          <input id="c-subject" className="field-input" aria-invalid={Boolean(errors.subject)} {...register("subject")} />
          <FieldError message={errors.subject?.message} />
        </div>
      </div>
      <div>
        <label htmlFor="c-message" className="field-label">
          Message *
        </label>
        <textarea id="c-message" rows={6} className="field-input resize-y" aria-invalid={Boolean(errors.message)} {...register("message")} />
        <FieldError message={errors.message?.message} />
      </div>
      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <input type="hidden" {...register("product_id")} />

      {result && !result.ok && (
        <p id="contact-result" role="alert" className="border border-[#9b2c2c]/30 bg-[#9b2c2c]/5 px-4 py-3 text-sm text-[#9b2c2c]">
          {result.message}
        </p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
