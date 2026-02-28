import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import WarMember from '@/lib/models/WarMember';
import Player from '@/lib/models/Player';

const COC_API_BASE = 'https://api.clashofclans.com/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { tag: string } }
) {
  try {
    const tag = decodeURIComponent(params.tag);
    const apiToken = process.env.COC_API_TOKEN;

    await connectToDatabase();

    // Try to fetch fresh data from COC API
    let cocPlayerData = null;
    if (apiToken) {
      const encodedTag = encodeURIComponent(tag);
      const response = await fetch(`${COC_API_BASE}/players/${encodedTag}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 },
      });
      if (response.ok) {
        cocPlayerData = await response.json();
      }
    }

    // Get war stats from our DB
    const warStats = await WarMember.find({ playerTag: tag }).lean();

    const totalStars = warStats.reduce((sum, w) => sum + (w.stars || 0), 0);
    const totalAttacks = warStats.reduce((sum, w) => sum + (w.attackCount || 0), 0);
    const totalDestruction = warStats.reduce((sum, w) => sum + ((w.destructionPercentage || 0) * (w.attackCount || 0)), 0);
    const threeStarAttacks = warStats.reduce((sum, w) => {
      return sum + (w.attacks?.filter((a: { stars?: number }) => a.stars === 3).length || 0);
    }, 0);

    const playerDoc = await Player.findOneAndUpdate(
      { tag },
      {
        tag,
        name: cocPlayerData?.name || warStats[0]?.playerName || tag,
        townHallLevel: cocPlayerData?.townHallLevel,
        expLevel: cocPlayerData?.expLevel,
        trophies: cocPlayerData?.trophies,
        bestTrophies: cocPlayerData?.bestTrophies,
        warStars: cocPlayerData?.warStars,
        attackWins: cocPlayerData?.attackWins,
        defenseWins: cocPlayerData?.defenseWins,
        totalStars,
        totalDestruction: totalAttacks > 0 ? totalDestruction / totalAttacks : 0,
        totalAttacks,
        threeStarRate: totalAttacks > 0 ? (threeStarAttacks / totalAttacks) * 100 : 0,
        averageStars: totalAttacks > 0 ? totalStars / totalAttacks : 0,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      player: playerDoc,
      cocData: cocPlayerData,
      warHistory: warStats,
    });
  } catch (error) {
    console.error('Error fetching player data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
