'use client';

import { useEffect, useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PlayerData {
  player: {
    tag: string;
    name: string;
    townHallLevel?: number;
    expLevel?: number;
    trophies?: number;
    warStars?: number;
    totalAttacks: number;
    totalStars: number;
    threeStarRate: number;
    averageStars: number;
    totalDestruction: number;
  };
  cocData?: {
    name: string;
    townHallLevel: number;
    expLevel: number;
    trophies: number;
    warStars: number;
    attackWins: number;
    defenseWins: number;
  };
  warHistory: Array<{
    _id: string;
    stars: number;
    attackCount: number;
    destructionPercentage: number;
    warDate?: string;
    attacks?: Array<{ stars: number; destructionPercentage: number }>;
  }>;
}

interface PlayerProfileProps {
  tag: string;
}

export default function PlayerProfile({ tag }: PlayerProfileProps) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/player/${encodeURIComponent(tag)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load player data'))
      .finally(() => setLoading(false));
  }, [tag]);

  if (loading) return <div className="text-gray-400 text-center py-8">Loading player data...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;
  if (!data) return <div className="text-gray-400 text-center py-8">Player not found.</div>;

  const { player, cocData, warHistory } = data;
  const displayName = cocData?.name || player.name || tag;

  const radarData = [
    { stat: 'Avg Stars', value: parseFloat(((player.averageStars || 0) / 3 * 100).toFixed(1)) },
    { stat: '3★ Rate', value: parseFloat((player.threeStarRate || 0).toFixed(1)) },
    { stat: 'Destruction', value: parseFloat((player.totalDestruction || 0).toFixed(1)) },
    { stat: 'Attacks', value: Math.min(100, ((player.totalAttacks || 0) / 50) * 100) },
  ];

  const warChartData = warHistory.slice(0, 10).map((w, i) => ({
    war: `War ${i + 1}`,
    stars: w.stars || 0,
    destruction: parseFloat((w.destructionPercentage || 0).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Player header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">{displayName}</h2>
            <p className="text-gray-400 font-mono text-sm mt-1">{player.tag}</p>
          </div>
          {cocData && (
            <div className="text-right">
              <p className="text-yellow-400 font-bold text-lg">TH{cocData.townHallLevel}</p>
              <p className="text-gray-400 text-sm">Level {cocData.expLevel}</p>
              <p className="text-gray-400 text-sm">🏆 {cocData.trophies}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Total Attacks</p>
            <p className="text-2xl font-bold text-white">{player.totalAttacks || 0}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Avg Stars</p>
            <p className="text-2xl font-bold text-yellow-400">{(player.averageStars || 0).toFixed(2)}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs">3★ Rate</p>
            <p className="text-2xl font-bold text-purple-400">{(player.threeStarRate || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Avg Destruction</p>
            <p className="text-2xl font-bold text-orange-400">{(player.totalDestruction || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {warHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance radar */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="stat" stroke="#9ca3af" />
                <Radar dataKey="value" stroke="#facc15" fill="#facc15" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Stars per war bar chart */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Stars Per War</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={warChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="war" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                <Bar dataKey="stars" fill="#facc15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
