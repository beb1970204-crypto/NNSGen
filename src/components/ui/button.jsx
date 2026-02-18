import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-white shadow hover:bg-opacity-90",
        defaultColor: "#D0021B",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-[#2a2a2a] bg-[#1a1a1a] text-white shadow-sm hover:bg-[#252525]",
        secondary:
          "bg-[#2a2a2a] text-white shadow-sm hover:bg-[#3a3a3a]",
        ghost: "hover:bg-[#252525] text-white hover:text-white",
        link: "text-red-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  
  // Apply default red color if variant is 'default'
  let finalClassName = className;
  if (variant === 'default') {
    finalClassName = cn(className, 'bg-[#D0021B] hover:bg-[#A0011B]');
  }
  
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, finalClassName }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }