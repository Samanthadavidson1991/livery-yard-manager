import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-12 px-4">
      <p className="text-gray-700 font-medium">{title}</p>
      {hint && <p className="text-sm text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-800",
};

export function Badge({
  children,
  color = "gray",
}: {
  children: ReactNode;
  color?: keyof typeof badgeColors;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[color]}`}
    >
      {children}
    </span>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnPrimary = `${btn} bg-brand-600 text-white hover:bg-brand-700`;
export const btnSecondary = `${btn} bg-white text-brand-700 border border-brand-200 hover:bg-brand-50`;
export const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`;
export const btnGhost = `${btn} text-gray-600 hover:bg-gray-100`;

export const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white";
export const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? btnPrimary
      : variant === "secondary"
        ? btnSecondary
        : btnGhost;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        className={inputClass}
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        required={required}
        placeholder={placeholder}
        step={step}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        className={inputClass}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
      />
    </label>
  );
}
