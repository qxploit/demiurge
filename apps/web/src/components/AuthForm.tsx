"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signin, signup } from "../lib/api";
import { cinzel } from "../app/fonts";

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder: string;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#6b5028]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-[#a9884f] bg-[#fbf3df] px-3 py-2.5 text-[#3c2a16] outline-none placeholder:text-[#b09a6a] focus:border-[#5a3d18] focus:ring-2 focus:ring-[#c99a4a]/40"
      />
    </label>
  );
}

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isSignup) await signup({ email, username, password });
      else await signin({ email, password });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/menu-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/25" />

      <form
        onSubmit={submit}
        className="relative w-[min(420px,90vw)] rounded-2xl border-2 border-[#7a5a2c] bg-gradient-to-b from-[#f4e7c6] to-[#cdb079] p-8 shadow-[0_12px_44px_rgba(30,15,4,0.6)]"
      >
        <h1 className={`${cinzel.className} text-center text-3xl font-black tracking-wide text-[#4a3218]`}>
          {isSignup ? "JOIN DEMIURGE" : "ENTER DEMIURGE"}
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-[#6b5028]">
          {isSignup ? "Forge your account" : "Return to the sands"}
        </p>

        {isSignup && (
          <Field label="Username" value={username} onChange={setUsername} type="text" placeholder="your name" />
        )}
        <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@demiurge.io" />
        <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="at least 6 characters" />

        {error && (
          <div className="mb-3 rounded border border-red-900/30 bg-red-900/15 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className={`${cinzel.className} mt-2 w-full rounded-lg border-2 border-[#5a3d18] bg-gradient-to-b from-[#e8c98a] to-[#b98a45] py-3 text-lg font-bold tracking-widest text-[#3c2a16] shadow-md transition hover:brightness-105 active:translate-y-[2px] disabled:opacity-60`}
        >
          {busy ? "..." : isSignup ? "CREATE ACCOUNT" : "SIGN IN"}
        </button>

        <p className="mt-5 text-center text-sm text-[#6b5028]">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link href={isSignup ? "/signin" : "/signup"} className="font-bold text-[#7a4a12] underline">
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </form>
    </main>
  );
}
