import * as React from "react"

import { cn } from "../../lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,  
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-6 py-6 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-gray-400 focus-visible:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-md",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
