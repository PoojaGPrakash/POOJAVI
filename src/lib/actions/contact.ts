"use server";

import { headers } from "next/headers";
import { contactSchema, type ContactInput } from "@/lib/validation/schemas";
import { getPublicSupabase } from "@/lib/supabase/public";
import { rateLimit } from "@/lib/rate-limit";
import { emptyToNull } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

export async function submitContactEnquiry(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return { ok: false, error: "You have sent several messages in a short time. Please try again in a few minutes or reach us on WhatsApp." };
  }

  const supabase = getPublicSupabase();
  if (!supabase) return { ok: false, error: "Enquiries are temporarily unavailable. Please contact us on WhatsApp or email." };

  const v = parsed.data;
  const { error } = await supabase.from("contact_enquiries").insert({
    name: v.name,
    email: v.email,
    phone: emptyToNull(v.phone),
    subject: emptyToNull(v.subject),
    message: v.message,
    product_id: emptyToNull(v.product_id),
  });

  if (error) {
    console.error("[contact] insert failed", error.message);
    return { ok: false, error: "We could not send your message just now. Please try again, or contact us on WhatsApp." };
  }
  return { ok: true, data: undefined, message: "Thank you — your message has been received. We will be in touch shortly." };
}
