import { X } from "lucide-react";

export function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-2xl bg-card border border-border shadow-card">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon} {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
        active
          ? "bg-gradient-primary text-primary-foreground shadow-soft"
          : "bg-card border border-border"
      }`}
    >
      {label}
    </button>
  );
}

export function IconBtn({
  children,
  onClick,
  destructive,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid place-items-center w-9 h-9 rounded-lg border active:scale-90 transition ${
        destructive
          ? "bg-destructive/10 border-destructive/20 text-destructive"
          : "bg-secondary border-border text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-background border border-border sm:rounded-2xl rounded-t-3xl shadow-soft"
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="grid place-items-center w-9 h-9 rounded-full bg-secondary active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
