import "./globals.css";

export const metadata = {
  title: "POOJAVI — Wear a Story",
  description: "A premium textile and fabric house. Discover the collection and enquire on WhatsApp."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
