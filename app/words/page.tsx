import { AddCardDialog } from "@/components/add-card-dialog";
import { CardList } from "@/components/card-list";
import { SiteHeader } from "@/components/site-header";

export default function WordsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-0">
        <section className="grid gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-1">
              <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Deck
              </p>
              <h1 className="font-serif text-3xl tracking-tight">Words</h1>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Tap a word to edit it. The ring is how well you know it from
                Yes and No reviews.
              </p>
            </div>
            <AddCardDialog triggerClassName="h-10 w-full sm:w-auto" />
          </div>
          <CardList />
        </section>
      </main>
    </div>
  );
}
