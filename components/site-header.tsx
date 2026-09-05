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
      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/words"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Words
        </Link>
      </nav>
    </header>
  );
}
