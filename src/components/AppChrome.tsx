"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

/** Sidebar + content shell, except on the login screen which stands alone. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
