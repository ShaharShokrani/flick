import { HomeView } from "@/components/home-view";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 sm:px-0">
        <HomeView />
      </main>
    </div>
  );
}
