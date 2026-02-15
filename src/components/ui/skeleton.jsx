import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#2a2a2a]", className)}
      {...props}
    />
  )
}

export { Skeleton }