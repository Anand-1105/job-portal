import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> { }

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-surface p-8',
                'border border-transparent hover:border-border',
                'transition-all duration-300',
                className
            )}
            {...props}
        />
    )
}
