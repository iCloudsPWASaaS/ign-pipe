import clsx from "clsx";

const styles: Record<string, string> = {
  Open: "bg-amber-100 text-amber-800",
  Close: "bg-emerald-100 text-emerald-800",
  Closed: "bg-emerald-100 text-emerald-800",
  Pending: "bg-slate-100 text-slate-700",
  EMG: "bg-red-100 text-red-800",
  URG: "bg-orange-100 text-orange-800",
  ROT: "bg-sky-100 text-sky-800",
  Active: "bg-emerald-100 text-emerald-800",
  Inactive: "bg-slate-100 text-slate-500",
  "No Access": "bg-red-100 text-red-800",
  Booked: "bg-brand-100 text-brand-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Declined: "bg-red-100 text-red-800",
};

export function StatusBadge({ value, className }: { value: unknown; className?: string }) {
  const text = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <span className={clsx("badge", styles[text] || "bg-slate-100 text-slate-700", className)}>
      {text}
    </span>
  );
}
