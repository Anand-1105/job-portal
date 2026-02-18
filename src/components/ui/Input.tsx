import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'w-full bg-transparent text-foreground',
                    'border-b border-border',
                    'focus:border-b-2 focus:border-foreground',
                    'focus:outline-none',
                    'transition-all duration-300',
                    'py-3 px-0',
                    'placeholder:text-muted placeholder:italic',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)

Input.displayName = 'Input'
