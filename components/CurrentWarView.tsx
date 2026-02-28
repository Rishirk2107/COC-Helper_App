import Link from 'next/link';

interface Attack {
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  order: number;
  duration: number;
}

interface WarMember {
  tag: string;
  name: string;
  townhallLevel: number;
  mapPosition: number;
  attacks?: Attack[];
}

interface ClanData {
  tag: string;
  name: string;
  stars: number;
  destructionPercentage: number;
  attacks: number;
  members: WarMember[];
}

interface WarData {
  state: string;
  teamSize: number;
  preparationStartTime: string;
  startTime: string;
  endTime: string;
  clan: ClanData;
  opponent: ClanData;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= stars ? 'text-yellow-400' : 'text-gray-600'}>★</span>
      ))}
    </span>
  );
}

async function fetchCurrentWar(): Promise<WarData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/war/current`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CurrentWarView() {
  const war = await fetchCurrentWar();

  if (!war) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
        <p className="text-gray-400 text-lg">Unable to load war data.</p>
        <p className="text-gray-500 text-sm mt-2">Ensure COC_API_TOKEN and CLAN_TAG are set.</p>
      </div>
    );
  }

  if (war.state === 'notInWar') {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
        <p className="text-yellow-400 text-2xl mb-2">⚠️ Not in War</p>
        <p className="text-gray-400">Your clan is not currently participating in a war.</p>
      </div>
    );
  }

  const stateLabel: Record<string, string> = {
    preparation: '⏳ Preparation',
    inWar: '⚔️ Battle Day',
    warEnded: '🏁 War Ended',
  };

  return (
    <div className="space-y-6">
      {/* War header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
            {stateLabel[war.state] || war.state}
          </span>
          <span className="text-gray-400 text-sm">{war.teamSize}v{war.teamSize}</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-white">{war.clan?.name}</p>
            <p className="text-3xl font-bold text-yellow-400">{war.clan?.stars || 0} ⭐</p>
            <p className="text-gray-400">{(war.clan?.destructionPercentage || 0).toFixed(1)}%</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-500">VS</span>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{war.opponent?.name}</p>
            <p className="text-3xl font-bold text-red-400">{war.opponent?.stars || 0} ⭐</p>
            <p className="text-gray-400">{(war.opponent?.destructionPercentage || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Member list */}
      {war.clan?.members && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold">{war.clan.name} — Members</h3>
          </div>
          <div className="divide-y divide-gray-700">
            {war.clan.members
              .sort((a, b) => a.mapPosition - b.mapPosition)
              .map((member) => {
                const totalStars = member.attacks?.reduce((s, a) => s + a.stars, 0) || 0;
                const totalDestruction = member.attacks?.reduce((s, a) => s + a.destructionPercentage, 0) || 0;
                const attackCount = member.attacks?.length || 0;
                return (
                  <div key={member.tag} className="px-6 py-4 flex items-center justify-between hover:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 text-sm w-6">#{member.mapPosition}</span>
                      <div>
                        <Link href={`/player/${encodeURIComponent(member.tag)}`} className="font-medium hover:text-yellow-400 transition">
                          {member.name}
                        </Link>
                        <p className="text-gray-500 text-xs">TH{member.townhallLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {attackCount > 0 ? (
                        <>
                          <StarRating stars={totalStars} />
                          <p className="text-gray-400 text-xs">{totalDestruction.toFixed(1)}% • {attackCount} attack{attackCount !== 1 ? 's' : ''}</p>
                        </>
                      ) : (
                        <span className="text-gray-600 text-sm">No attacks</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
