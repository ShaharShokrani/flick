"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";

import { AuthDialog } from "@/components/auth-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signOut, useSession } from "@/lib/auth-client";
import { isGuestEmail } from "@/lib/guest-code";

type Features = {
  configured: boolean;
  google: boolean;
  remoteDatabase: boolean;
};

export function AccountMenu() {
  const { data: session, isPending } = useSession();
  const [features, setFeatures] = useState<Features | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/features", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Features) => setFeatures(data))
      .catch(() => {
        setFeatures({
          configured: false,
          google: false,
          remoteDatabase: false,
        });
      });
  }, []);

  const user = session?.user;
  const guestCode =
    user && "guestCode" in user && typeof user.guestCode === "string"
      ? user.guestCode
      : null;
  const guest = Boolean(user && isGuestEmail(user.email));

  if (isPending) {
    return (
      <span className="text-xs text-muted-foreground" aria-hidden>
        …
      </span>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          className="h-8 px-2 text-muted-foreground"
          onClick={() => setAuthOpen(true)}
        >
          <LogIn data-icon="inline-start" />
          Sign in
        </Button>
        <AuthDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          features={features}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        className="h-8 max-w-36 truncate px-2 text-muted-foreground"
        onClick={() => setAccountOpen(true)}
      >
        {guest ? "Guest" : user.name || user.email}
      </Button>
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{guest ? "Guest account" : "Your account"}</DialogTitle>
            <DialogDescription>
              {features?.remoteDatabase
                ? "Words you add here show up on any device signed into this account."
                : "This computer is using a local database. Add DATABASE_URL on Vercel and this computer so your phone sees the same words."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <p className="text-muted-foreground">
              {guest
                ? "You are signed in as a guest. Enter this code on your phone to open the same deck."
                : user.email}
            </p>
            {guestCode ? (
              <p className="rounded-xl bg-secondary px-4 py-3 text-center font-mono text-2xl tracking-[0.2em]">
                {guestCode}
              </p>
            ) : null}
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                setAccountOpen(false);
              }}
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
