"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Every lobby / match lives at /play/<uuid>. Hitting /play mints a new room.
export default function PlayIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/play/${crypto.randomUUID()}`);
  }, [router]);
  return <main className="fixed inset-0 grid place-items-center bg-[#150d05] text-[#e6cf9a]">entering lobby...</main>;
}
