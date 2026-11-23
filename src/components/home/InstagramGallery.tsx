import { InstagramIcon } from "@/components/ui/InstagramIcon";
import Image from "next/image";

import { publicImageUrl } from "@/lib/storage";
import type { InstagramPostRow } from "@/lib/database.types";

export function InstagramGallery({ posts, profileUrl, handle }: { posts: InstagramPostRow[]; profileUrl: string | null; handle: string | null }) {
  const items = posts.map((p) => ({ ...p, url: publicImageUrl(p.image_path) })).filter((p) => p.url);
  if (!items.length && !profileUrl) return null;
  const cleanHandle = handle?.replace(/^@/, "");

  return (
    <section className="py-20 sm:py-28">
      <div className="container-luxe">
        <div className="mb-10 flex flex-col items-center text-center sm:mb-14">
          <p className="eyebrow mb-4">Follow the story</p>
          <h2 className="display-2">{cleanHandle ? `@${cleanHandle}` : "On Instagram"}</h2>
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-8">
              <InstagramIcon className="h-4 w-4" /> Follow us
            </a>
          )}
        </div>
        {items.length > 0 && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {items.slice(0, 8).map((post) => {
              const inner = (
                <>
                  <Image src={post.url!} alt={post.caption || "Poojavi The Label on Instagram"} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="img-zoom object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-burgundy/0 text-ivory opacity-0 transition duration-500 group-hover:bg-burgundy/40 group-hover:opacity-100">
                    <InstagramIcon className="h-6 w-6" />
                  </span>
                </>
              );
              const href = post.post_url || profileUrl;
              return (
                <li key={post.id} className="group relative aspect-square overflow-hidden bg-beige">
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label={post.caption ? `Instagram post: ${post.caption}` : "View on Instagram"}>
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
