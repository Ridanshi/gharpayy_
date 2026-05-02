import { cn } from "@/lib/utils";

export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  return src ? (
    <img src={src} alt={name} className={cn("h-8 w-8 rounded-full border object-cover", className)} />
  ) : (
    <span className={cn("grid h-8 w-8 place-items-center rounded-full border bg-muted text-xs font-semibold", className)}>{name.slice(0, 2).toUpperCase()}</span>
  );
}
