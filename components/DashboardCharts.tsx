'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';

interface WarData {
  _id: string;
  clan: { stars: number; destructionPercentage: number; name: string };
  opponent: { stars: number; destructionPercentage: number; name: string };
  fetchedAt: string;
}

export default function DashboardCharts() {
  const [wars, setWars] = useState<WarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/war/history')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWars(data.slice(0, 10));
        else setError('Failed to load war data');
      })
      .catch(() => setError('Failed to load war data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-center py-8">Loading charts...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;
  if (wars.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
        <p className="text-gray-400 text-lg">No war data available yet.</p>
        <p className="text-gray-500 text-sm mt-2">Visit /api/war/current to fetch and store war data.</p>
      </div>
    );
  }

  const chartData = wars
    .slice()
    .reverse()
    .map((war, i) => ({
      name: `War ${i + 1}`,
      'Clan Stars': war.clan?.stars || 0,
      'Opponent Stars': war.opponent?.stars || 0,
      'Clan Destruction': parseFloat((war.clan?.destructionPercentage || 0).toFixed(1)),
    }));

  const resultData = wars.reduce(
    (acc, war) => {
      if ((war.clan?.stars || 0) > (war.opponent?.stars || 0)) acc[0].value++;
      else if ((war.clan?.stars || 0) < (war.opponent?.stars || 0)) acc[1].value++;
      else acc[2].value++;
      return acc;
    },
    [
      { name: 'Wins', value: 0 },
      { name: 'Losses', value: 0 },
      { name: 'Draws', value: 0 },
    ]
  );

  const COLORS = ['#22c55e', '#ef4444', '#eab308'];

  return (
    <div className="space-y-8">
      {/* Stars comparison bar chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Stars Per War</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Legend />
            <Bar dataKey="Clan Stars" fill="#facc15" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Opponent Stars" fill="#6b7280" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Destruction line chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">Destruction % Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
              <Line type="monotone" dataKey="Clan Destruction" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={resultData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {resultData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
