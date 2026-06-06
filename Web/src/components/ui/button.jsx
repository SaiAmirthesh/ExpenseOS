import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:pointer-events-none disabled:opacity-50 active:scale-98 cursor-pointer duration-150",
  {
    variants: {
      variant: {
        default:
          "bg-brand-accent text-brand-bg hover:bg-brand-accent-hover shadow-lg shadow-brand-accent/5 hover:shadow-brand-accent/15",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline:
          "border border-brand-border bg-transparent text-brand-text hover:bg-brand-surface/50 hover:border-brand-text/20",
        secondary:
          "bg-brand-surface text-brand-text hover:bg-brand-card border border-brand-border",
        ghost: "hover:bg-brand-surface hover:text-brand-text text-brand-muted",
        link: "text-brand-accent underline-offset-4 hover:underline",
        glass: "bg-white/5 backdrop-blur-md text-brand-text hover:bg-white/10 border border-white/10"
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
