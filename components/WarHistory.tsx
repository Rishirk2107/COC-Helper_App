import connectToDatabase from '@/lib/mongodb';
import War from '@/lib/models/War';
import Link from 'next/link';

async function getWarHistory() {
  try {
    await connectToDatabase();
    return await War.find({}).sort({ fetchedAt: -1 }).limit(20).lean();
  } catch {
    return [];
  }
}

interface WarRecord {
  _id?: { toString(): string };
  clan?: { name?: string; stars?: number; destructionPercentage?: number };
  opponent?: { name?: string; stars?: number };
  teamSize?: number;
  fetchedAt?: Date | string;
}

export default async function WarHistory() {
  const wars = await getWarHistory() as WarRecord[];

  if (wars.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
        <p className="text-gray-400 text-lg">No war history found.</p>
        <p className="text-gray-500 text-sm mt-2">
          <Link href="/war/current" className="text-yellow-400 hover:underline">Fetch current war</Link> to start tracking history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {wars.map((war: WarRecord) => {
        const clanStars = war.clan?.stars || 0;
        const oppStars = war.opponent?.stars || 0;
        const result = clanStars > oppStars ? 'win' : clanStars < oppStars ? 'loss' : 'draw';
        const resultColors: Record<string, { text: string; bg: string; border: string }> = {
          win: { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
          loss: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
          draw: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
        };

        return (
          <div key={war._id?.toString()} className={`bg-gray-800 rounded-xl p-6 border ${resultColors[result].border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${resultColors[result].text} ${resultColors[result].bg} ${resultColors[result].border}`}>
                  {result.toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold text-white">
                    {war.clan?.name} vs {war.opponent?.name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {war.teamSize}v{war.teamSize} •{' '}
                    {war.fetchedAt ? new Date(war.fetchedAt).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  <span className="text-yellow-400">{clanStars}⭐</span>
                  <span className="text-gray-500 mx-2">vs</span>
                  <span className="text-gray-400">{oppStars}⭐</span>
                </p>
                <p className="text-gray-500 text-sm">
                  {(war.clan?.destructionPercentage || 0).toFixed(1)}% destruction
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
