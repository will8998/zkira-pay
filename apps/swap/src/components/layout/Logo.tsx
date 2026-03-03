import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="relative">
        <span className="text-2xl font-bold tracking-[0.2em] text-white font-[family-name:var(--font-mono)] transform skew-x-[-8deg]">
          ZKIRA
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-red)]/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  )
}
