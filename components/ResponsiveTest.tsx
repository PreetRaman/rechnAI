'use client'

import { useState, useEffect } from 'react'

export default function ResponsiveTest() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    breakpoint: ''
  })

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      let breakpoint = 'xs'
      if (width >= 640) breakpoint = 'sm'
      if (width >= 768) breakpoint = 'md'
      if (width >= 1024) breakpoint = 'lg'
      if (width >= 1280) breakpoint = 'xl'
      if (width >= 1536) breakpoint = '2xl'
      
      setScreenSize({ width, height, breakpoint })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
      <div>Width: {screenSize.width}px</div>
      <div>Height: {screenSize.height}px</div>
      <div>Breakpoint: {screenSize.breakpoint}</div>
    </div>
  )
} 