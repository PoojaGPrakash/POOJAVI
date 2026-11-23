"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBannerActive } from "@/lib/actions/admin/banners";
import { Toggle } from "./Toggle";
import { useToast } from "./Toast";

export function BannerActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <div className="w-28">
      <Toggle
        id={`banner-${id}`}
        label={isActive ? "Visible" : "Hidden"}
        checked={isActive}
        disabled={pending}
        onChange={(v) =>
          startTransition(async () => {
            const res = await setBannerActive(id, v);
            if (res.ok) {
              toast.success(res.message ?? "Updated.");
              router.refresh();
            } else toast.error(res.error);
          })
        }
      />
    </div>
  );
}
