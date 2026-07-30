import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--warm-cream)' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--tennis-green)]">404</h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">页面不存在</p>
        <Link href="/" className="mt-6 inline-block px-6 py-2 bg-[var(--tennis-green)] text-white rounded-full hover:opacity-90 transition">
          返回首页
        </Link>
      </div>
    </div>
  );
}
