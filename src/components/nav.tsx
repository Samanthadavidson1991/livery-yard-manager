"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

export type NavItem = { label: string; href: string };

export function Sidebar({
  yardName,
  userName,
  role,
  items,
  adminItems,
}: {
  yardName: string;
  userName: string;
  role: string;
  items: NavItem[];
  adminItems: NavItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkCls = (href: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-brand-600 text-white"
        : "text-brand-50/90 hover:bg-brand-700/60"
    }`;
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-brand-800 text-white px-4 py-3">
        <span className="font-semibold truncate">{yardName}</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-md p-2 hover:bg-brand-700"
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <aside
        className={`${open ? "block" : "hidden"} md:block bg-brand-800 text-white w-full md:w-64 md:min-h-screen md:sticky md:top-0 flex-shrink-0`}
      >
        <div className="hidden md:block px-5 py-5 border-b border-brand-700">
          <Link href="/dashboard" className="text-lg font-semibold leading-tight">
            {yardName}
          </Link>
          <p className="text-xs text-brand-200 mt-1">Yard Manager</p>
        </div>

        <nav className="p-3 space-y-1">
          <Link href="/dashboard" className={linkCls("/dashboard")} onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          {items.map((it) => (
            <Link key={it.href} href={it.href} className={linkCls(it.href)} onClick={() => setOpen(false)}>
              {it.label}
            </Link>
          ))}

          {adminItems.length > 0 && (
            <div className="pt-3 mt-2 border-t border-brand-700">
              <p className="px-3 pb-1 text-xs uppercase tracking-wide text-brand-300">
                Admin
              </p>
              {adminItems.map((it) => (
                <Link key={it.href} href={it.href} className={linkCls(it.href)} onClick={() => setOpen(false)}>
                  {it.label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="p-3 mt-auto border-t border-brand-700">
          <div className="px-3 py-2 text-sm">
            <p className="font-medium truncate">{userName}</p>
            <p className="text-xs text-brand-200">{role === "ADMIN" ? "Administrator" : "Livery"}</p>
          </div>
          <form action={logoutAction}>
            <button className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-brand-50/90 hover:bg-brand-700/60">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
