interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed border-canopy-600 px-6 py-10 text-center">
      {icon && <div className="mb-1 text-canopy-400">{icon}</div>}
      <p className="font-mono text-sm text-canopy-200">{title}</p>
      {description && <p className="max-w-xs text-xs text-canopy-400">{description}</p>}
    </div>
  );
}
