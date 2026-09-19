import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
        outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
        neutral: 'bg-muted text-muted-foreground',
        info: 'bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-400/20',
        success: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-400/20',
        warning: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-300/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const statusToneVariants: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground',
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-300',
  error: 'bg-destructive',
};

type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, 'variant'> & {
  tone?: StatusTone;
  showDot?: boolean;
};

function StatusBadge({
  className,
  tone = 'neutral',
  showDot = true,
  children,
  ...props
}: StatusBadgeProps) {
  const variant = tone === 'error' ? 'destructive' : tone;

  return (
    <Badge
      data-slot="status-badge"
      data-tone={tone}
      variant={variant}
      className={cn('gap-1.5', className)}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn('size-1.5 rounded-full', statusToneVariants[tone])}
        />
      )}
      {children}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };
export type { StatusBadgeProps, StatusTone };
