import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

function TooltipProvider({ delayDuration = 250, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

const TooltipTrigger = TooltipPrimitive.TooltipTrigger
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-fit rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border',
        className,
      )}
      {...props}
    >
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))

/** Convenience wrapper: <Hint label="Frame (F)"><Button…/></Hint> */
function Hint({
  label,
  children,
  side = 'bottom',
  delay = 250,
  hoverOnly = false,
}: {
  label: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** ms of hover before it appears; a roomy default keeps a swept-over grid quiet */
  delay?: number
  /** ignore focus: for fields, where a tooltip over the value you are typing into is in the way */
  hoverOnly?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  React.useEffect(() => clear, [])

  if (hoverOnly) {
    return (
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root open={open} onOpenChange={() => {}}>
          <TooltipPrimitive.Trigger
            asChild
            onMouseEnter={() => {
              clear()
              timer.current = setTimeout(() => setOpen(true), delay)
            }}
            onMouseLeave={() => {
              clear()
              setOpen(false)
            }}
            onPointerDown={() => {
              clear()
              setOpen(false)
            }}
          >
            {children}
          </TooltipPrimitive.Trigger>
          <TooltipContent side={side}>{label}</TooltipContent>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    )
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipContent side={side}>{label}</TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Hint }
