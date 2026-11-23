export function AnnouncementBar({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="bg-burgundy text-ivory">
      <p className="container-luxe py-2.5 text-center text-[0.62rem] leading-relaxed tracking-[0.24em] uppercase sm:text-[0.66rem]">{text}</p>
    </div>
  );
}
