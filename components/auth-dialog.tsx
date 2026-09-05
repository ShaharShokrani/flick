"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";
import { generateGuestCode, normalizeGuestCode, guestEmail } from "@/lib/guest-code";

type Features = {
  configured: boolean;
  google: boolean;
} | null;

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  features: Features;
};

type Mode = "choose" | "email" | "code" | "guest-ready";

export function AuthDialog({ open, onOpenChange, features }: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [guestCode, setGuestCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setMode("choose");
    setEmail("");
    setPassword("");
    setCreating(false);
    setCode("");
    setGuestCode("");
    setError("");
    setBusy(false);
  }

  async function handleGoogle() {
    setBusy(true);
    setError("");
    const result = await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed.");
      setBusy(false);
    }
  }

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = creating
      ? await signUp.email({
          email: email.trim(),
          password,
          name: email.trim().split("@")[0] || "Flick",
        })
      : await signIn.email({
          email: email.trim(),
          password,
        });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Could not sign in with email.");
      return;
    }
    onOpenChange(false);
    reset();
  }

  async function handleGuest() {
    setBusy(true);
    setError("");
    const nextCode = generateGuestCode();
    const result = await signUp.email({
      email: guestEmail(nextCode),
      password: nextCode,
      name: "Guest",
    });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Could not start a guest session.");
      return;
    }
    setGuestCode(nextCode);
    setMode("guest-ready");
  }

  async function handleGuestCode(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeGuestCode(code);
    if (!normalized) {
      setError("That code should look like 7K2M-9Q4P.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await signIn.email({
      email: guestEmail(normalized),
      password: normalized,
    });
    setBusy(false);
    if (result.error) {
      setError("That guest code was not found.");
      return;
    }
    onOpenChange(false);
    reset();
  }

  const configured = features?.configured ?? false;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "guest-ready"
              ? "Your guest code"
              : mode === "code"
                ? "Enter a guest code"
                : mode === "email"
                  ? creating
                    ? "Create an email login"
                    : "Sign in with email"
                  : "Sign in"}
          </DialogTitle>
          <DialogDescription>
            {mode === "guest-ready"
              ? "Save this code. You can enter it later to open your words."
              : mode === "code"
                ? "Paste the guest code you already have."
                : mode === "email"
                  ? creating
                    ? "Pick an email and a password."
                    : "Enter your email and password."
                  : "Google, email, or guest. Your words stay in the cloud."}
          </DialogDescription>
        </DialogHeader>

        {!configured ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Cloud sign-in is still starting up. Try again in a moment.
          </p>
        ) : mode === "choose" ? (
          <div className="grid gap-2">
            {features?.google ? (
              <Button onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => setMode("email")}
              disabled={busy}
            >
              Continue with email
            </Button>
            <Button variant="secondary" onClick={handleGuest} disabled={busy}>
              Continue as guest
            </Button>
            <button
              type="button"
              className="mt-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => setMode("code")}
            >
              I have a guest code
            </button>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : mode === "email" ? (
          <form onSubmit={handleEmail} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={creating ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {creating ? "Create login" : "Sign in"}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => {
                setCreating((value) => !value);
                setError("");
              }}
            >
              {creating ? "I already have an email login" : "Create an email login"}
            </button>
          </form>
        ) : mode === "code" ? (
          <form onSubmit={handleGuestCode} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="guest-code">Guest code</Label>
              <Input
                id="guest-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="7K2M-9Q4P"
                autoComplete="one-time-code"
                className="font-mono tracking-[0.2em]"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              Open words
            </Button>
          </form>
        ) : (
          <div className="grid gap-3">
            <p className="rounded-xl bg-secondary px-4 py-3 text-center font-mono text-2xl tracking-[0.2em]">
              {guestCode}
            </p>
            <Button
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
