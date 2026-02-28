import connectToDatabase from '@/lib/mongodb';
import War from '@/lib/models/War';
import WarMember from '@/lib/models/WarMember';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, color = 'text-yellow-400' }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

interface WarDoc {
  clan?: { stars?: number; destructionPercentage?: number };
  opponent?: { stars?: number };
}

async function getStats() {
  try {
    await connectToDatabase();
    const totalWars = await War.countDocuments();
    const wars = await War.find({}).lean() as WarDoc[];

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalDestruction = 0;

    for (const war of wars) {
      const clanStars = war.clan?.stars || 0;
      const oppStars = war.opponent?.stars || 0;
      totalDestruction += war.clan?.destructionPercentage || 0;
      if (clanStars > oppStars) wins++;
      else if (clanStars < oppStars) losses++;
      else draws++;
    }

    const members = await WarMember.find({}).lean();
    const totalAttacks = members.reduce((s, m) => s + (m.attackCount || 0), 0);
    const totalStars = members.reduce((s, m) => s + (m.stars || 0), 0);
    const threeStars = members.reduce((s, m) => s + (m.attacks?.filter((a: { stars?: number }) => a.stars === 3).length || 0), 0);

    return {
      totalWars,
      wins,
      losses,
      draws,
      avgStars: totalAttacks > 0 ? (totalStars / totalAttacks).toFixed(2) : '0.00',
      threeStarRate: totalAttacks > 0 ? ((threeStars / totalAttacks) * 100).toFixed(1) : '0.0',
      avgDestruction: totalWars > 0 ? (totalDestruction / totalWars).toFixed(1) : '0.0',
    };
  } catch {
    return {
      totalWars: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      avgStars: '0.00',
      threeStarRate: '0.0',
      avgDestruction: '0.0',
    };
  }
}

export default async function DashboardStats() {
  const stats = await getStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard title="Total Wars" value={stats.totalWars} subtitle="Wars recorded" />
      <StatCard
        title="Win Rate"
        value={stats.totalWars > 0 ? `${((stats.wins / stats.totalWars) * 100).toFixed(0)}%` : 'N/A'}
        subtitle={`${stats.wins}W / ${stats.losses}L / ${stats.draws}D`}
        color="text-green-400"
      />
      <StatCard title="Avg Stars/Attack" value={stats.avgStars} subtitle="Per attack" color="text-blue-400" />
      <StatCard title="3★ Rate" value={`${stats.threeStarRate}%`} subtitle="Three star rate" color="text-purple-400" />
      <StatCard title="Avg Destruction" value={`${stats.avgDestruction}%`} subtitle="Per war" color="text-orange-400" />
    </div>
  );
}
