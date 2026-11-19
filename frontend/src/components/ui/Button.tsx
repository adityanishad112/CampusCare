import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "teal" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover shadow-sm focus-visible:ring-primary",
      secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-sm focus-visible:ring-secondary",
      teal: "bg-accent text-white hover:bg-accent-hover shadow-sm focus-visible:ring-accent",
      outline: "border border-border bg-white text-foreground hover:bg-slate-50 focus-visible:ring-primary shadow-subtle",
      ghost: "text-foreground hover:bg-slate-100 hover:text-primary focus-visible:ring-primary",
      destructive: "bg-destructive text-white hover:bg-red-700 shadow-sm focus-visible:ring-destructive",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs min-h-[32px]",
      md: "h-10 px-4 text-sm min-h-[40px]",
      lg: "h-12 px-6 text-base min-h-[48px]",
      icon: "h-10 w-10 min-h-[40px] min-w-[40px] p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
