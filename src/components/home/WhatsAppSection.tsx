import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { Monogram } from "@/components/brand/Monogram";

export function WhatsAppSection({ hasNumber }: { hasNumber: boolean }) {
  if (!hasNumber) return null;
  return (
    <section className="border-y border-line/60 bg-beige/60">
      <div className="container-luxe flex flex-col items-center py-20 text-center sm:py-24">
        <Monogram className="mb-8 h-12 w-12 text-burgundy" />
        <p className="eyebrow mb-4">Personal assistance</p>
        <h2 className="display-2 max-w-2xl">Let us help you find your piece</h2>
        <p className="body-lg mt-5 max-w-xl">
          Ask about availability, request more photographs or seek styling advice — we reply personally on WhatsApp.
        </p>
        <WhatsAppButton className="mt-10" label="Start a conversation" />
      </div>
    </section>
  );
}
