import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-2.5 py-0.5 border',
  {
    variants: {
      variant: {
        neutral: 'bg-white/5 text-muted border-border',
        positive: 'bg-positive/10 text-positive border-positive/30',
        negative: 'bg-negative/10 text-negative border-negative/30',
        gold: 'bg-gold/10 text-gold border-gold/30',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

interface Props extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: Props) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
