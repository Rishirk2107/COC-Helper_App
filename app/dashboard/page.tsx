import { Suspense } from 'react';
import Link from 'next/link';
import DashboardStats from '@/components/DashboardStats';
import DashboardCharts from '@/components/DashboardCharts';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">⚔️ COC War Intelligence</h1>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-yellow-400 font-semibold">Dashboard</Link>
            <Link href="/war/current" className="text-gray-300 hover:text-yellow-400 transition">Current War</Link>
            <Link href="/war/history" className="text-gray-300 hover:text-yellow-400 transition">War History</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-gray-400 mb-8">Clan War Performance Overview</p>

        <Suspense fallback={<div className="text-gray-400">Loading stats...</div>}>
          <DashboardStats />
        </Suspense>

        <Suspense fallback={<div className="text-gray-400 mt-8">Loading charts...</div>}>
          <DashboardCharts />
        </Suspense>
      </main>
    </div>
  );
}
