'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zkira-bg border-b border-zkira-border">
      <div className="flex items-center justify-center h-16 px-6 max-w-7xl mx-auto">
        <nav className="flex items-center space-x-8">
          <Link 
            href="/" 
            className={`${
              pathname === '/' 
                ? 'text-white border-b-2 border-zkira-green pb-1' 
                : 'text-zkira-text-secondary hover:text-white'
            } font-medium transition-colors`}
          >
            SWAP
          </Link>
          <span className="text-zkira-text-secondary">|</span>
          <Link 
            href="/about" 
            className={`${
              pathname === '/about' 
                ? 'text-white border-b-2 border-zkira-green pb-1' 
                : 'text-zkira-text-secondary hover:text-white'
            } font-medium transition-colors`}
          >
            ABOUT
          </Link>
        </nav>
      </div>
    </header>
  )
}