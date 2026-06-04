import { cn } from "@/lib/utils/helpers";
import { Archive, CheckCircle2, XCircle } from "lucide-react";

export function ProductStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    active: {
      label: "Active",
      color:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    inactive: {
      label: "Inactive",
      color:
        "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
      icon: <XCircle className="h-3 w-3" />,
    },
    archived: {
      label: "Archived",
      color:
        "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      icon: <Archive className="h-3 w-3" />,
    },
  };
  const cfg = map[status] ?? map.inactive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
        cfg.color,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
