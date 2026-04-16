"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function ShimmerButton({ loading, children, className, disabled, ...props }: ShimmerButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={cn(
        "relative overflow-hidden w-full py-2.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}
      {children}
    </button>
  )
}
