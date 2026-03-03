'use client'
import { useState, useEffect } from 'react'

export default function Footer() {
  const [isOperational, setIsOperational] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/v1/health')
        setIsOperational(response.ok)
      } catch {
        setIsOperational(false)
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-zkira-bg border-t border-zkira-border">
      <div className="flex items-center justify-between h-9 px-6 max-w-7xl mx-auto text-xs">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOperational ? 'bg-zkira-green animate-pulse-dot' : 'bg-zkira-red'}`} />
          <span className={isOperational ? 'text-zkira-green' : 'text-zkira-red'}>
            {isOperational ? 'OPERATIONAL' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="https://x.com/zkira_xyz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-zkira-text-secondary hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}