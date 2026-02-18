import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'ghost' | 'link' | 'outline'
    size?: 'default' | 'sm' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                className={cn(
                    'inline-flex items-center justify-center font-medium transition-all duration-300',
                    'disabled:opacity-40 disabled:pointer-events-none',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
                    {
                        'default': 'border border-foreground text-foreground hover:bg-foreground hover:text-background px-6 py-2.5',
                        'ghost': 'text-foreground hover:opacity-70',
                        'link': 'text-foreground underline underline-offset-4 hover:opacity-70',
                        'outline': 'border border-border text-foreground hover:bg-surface px-6 py-2.5',
                    }[variant],
                    {
                        'default': 'text-base',
                        'sm': 'text-sm px-4 py-2',
                        'lg': 'text-lg px-8 py-3',
                    }[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)

Button.displayName = 'Button'
