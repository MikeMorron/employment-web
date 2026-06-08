interface StarsProps {
  rating: number;
  max?: number;
  className?: string;
}

export function Stars({ rating, max = 5, className = "" }: StarsProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} de ${max} estrellas`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 1.5l1.64 3.32 3.66.53-2.65 2.58.63 3.64L8 9.77 4.72 11.57l.63-3.64L2.7 5.35l3.66-.53L8 1.5z" />
        </svg>
      ))}
    </span>
  );
}
