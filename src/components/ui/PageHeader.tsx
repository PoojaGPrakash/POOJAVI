import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { StoreImage } from "./StoreImage";

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  imagePath,
  seed,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  crumbs: Crumb[];
  imagePath?: string | null;
  seed?: string;
}) {
  if (imagePath) {
    return (
      <header className="relative mb-12 h-[52svh] min-h-[380px] overflow-hidden sm:mb-16">
        <StoreImage path={imagePath} alt={title} fallbackSeed={seed ?? title} sizes="100vw" preload quality={85} />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
        <div className="container-luxe relative flex h-full flex-col items-center justify-end pb-14 text-center text-ivory">
          {eyebrow && <p className="mb-4 text-[0.66rem] tracking-[0.34em] uppercase">{eyebrow}</p>}
          <h1 className="display-1 text-ivory">{title}</h1>
          {description && <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-ivory/85">{description}</p>}
        </div>
      </header>
    );
  }
  return (
    <header className="container-luxe pt-10 pb-12 sm:pt-14 sm:pb-16">
      <Breadcrumbs items={crumbs} />
      <div className="mt-10 flex flex-col items-center text-center sm:mt-14">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="display-1">{title}</h1>
        <span className="rule mt-7" aria-hidden="true" />
        {description && <p className="body-lg mt-7 max-w-2xl">{description}</p>}
      </div>
    </header>
  );
}
