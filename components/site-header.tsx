import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-5 sm:px-0">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          F
        </span>
        <span className="font-serif text-xl tracking-tight">Flick</span>
      </Link>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        Flashcards only
      </p>
    </header>
  );
}
