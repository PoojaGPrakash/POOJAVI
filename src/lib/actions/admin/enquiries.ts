"use server";

import { revalidatePath } from "next/cache";
import { adminAction, dbError, fail, validate } from "./helpers";
import { enquiryStatusSchema, idSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "@/lib/types";

export async function setEnquiryStatus(id: string, status: "new" | "read" | "archived"): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const v = validate(enquiryStatusSchema, { id, status });
    if (!v.ok) return v;
    const { error, count } = await supabase.from("contact_enquiries").update({ status: v.data.status }, { count: "exact" }).eq("id", v.data.id);
    if (error) return dbError(error);
    if (!count) return fail("This enquiry no longer exists.");
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined, message: "Enquiry updated." };
  });
}

export async function deleteEnquiry(id: string): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const v = validate(idSchema, { id });
    if (!v.ok) return v;
    const { error, count } = await supabase.from("contact_enquiries").delete({ count: "exact" }).eq("id", v.data.id);
    if (error) return dbError(error);
    if (!count) return fail("This enquiry no longer exists.");
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined, message: "Enquiry deleted." };
  });
}
