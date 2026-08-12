'use client'

import { type ReactNode, type HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & { 
  children?: ReactNode
  config?: any
  'data-dynamic'?: boolean | string
}

export function LiquidGlass({ children, className = '', config, ...rest }: Props) {
  return (
    <div 
      className={`kf-liquid-glass ${className}`} 
      data-config={config ? JSON.stringify(config) : undefined}
      {...rest}
    >
      {children}
    </div>
  )
}
