import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({ className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2 text-canopy-300", className)}>
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-canopy-500 border-t-signal-gold" />
      {label && <span className="font-mono text-xs">{label}</span>}
    </div>
  );
}
