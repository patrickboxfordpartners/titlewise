"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:bg-accent/90 rounded-[4px] border-0",
        destructive: "bg-destructive text-white hover:bg-destructive/90 rounded-[4px]",
        outline: "border border-border bg-surface-elevated text-foreground hover:bg-surface rounded-[4px]",
        secondary: "bg-surface-elevated text-foreground hover:bg-surface border border-border rounded-[4px]",
        ghost: "hover:bg-surface text-muted-foreground rounded-[4px]",
        link: "text-accent underline-offset-4 hover:underline",
        hero: "bg-accent text-white hover:bg-accent/90 font-semibold shadow-md transition-all duration-150 rounded-[4px]",
        "hero-outline": "border-2 border-border bg-surface text-foreground hover:bg-surface-elevated font-semibold rounded-[4px]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
