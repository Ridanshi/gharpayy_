import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "icon" }>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-md font-medium transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-9 w-9",
        variant === "primary" && "bg-gradient-to-b from-primary to-orange-600 text-primary-foreground shadow-orange-glow hover:translate-y-[-1px] hover:brightness-105",
        variant === "secondary" && "border border-border/80 bg-card/80 text-foreground shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/80 hover:shadow-dark-soft",
        variant === "ghost" && "hover:-translate-y-0.5 hover:bg-muted/80",
        variant === "danger" && "bg-destructive text-destructive-foreground shadow-sm hover:translate-y-[-1px] hover:opacity-90",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
