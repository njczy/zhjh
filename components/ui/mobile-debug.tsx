"use client"

import React from 'react'
import { useIsMobile } from './use-mobile'

export function MobileDebug() {
  const isMobile = useIsMobile()
  const [windowInfo, setWindowInfo] = React.useState<{
    width: number
    height: number
    userAgent: string
  } | null>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateInfo = () => {
        setWindowInfo({
          width: window.innerWidth,
          height: window.innerHeight,
          userAgent: navigator.userAgent
        })
      }
      
      updateInfo()
      window.addEventListener('resize', updateInfo)
      return () => window.removeEventListener('resize', updateInfo)
    }
  }, [])

  // 只在开发环境显示调试信息
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 text-xs rounded z-50 max-w-xs">
      <div>移动端: {isMobile ? '是' : '否'}</div>
      {windowInfo && (
        <>
          <div>屏幕: {windowInfo.width}x{windowInfo.height}</div>
          <div>UA: {windowInfo.userAgent.slice(0, 30)}...</div>
        </>
      )}
    </div>
  )
}