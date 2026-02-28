import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import War from '@/lib/models/War';
import WarMember from '@/lib/models/WarMember';
import type { Attack } from '@/lib/types';

const COC_API_BASE = 'https://api.clashofclans.com/v1';

export async function GET() {
  try {
    const clanTag = process.env.CLAN_TAG;
    const apiToken = process.env.COC_API_TOKEN;

    if (!clanTag || !apiToken) {
      return NextResponse.json(
        { error: 'Missing CLAN_TAG or COC_API_TOKEN environment variables' },
        { status: 500 }
      );
    }

    const encodedTag = encodeURIComponent(clanTag);
    const response = await fetch(
      `${COC_API_BASE}/clans/${encodedTag}/currentwar`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Failed to fetch war data from COC API', details: errorData },
        { status: response.status }
      );
    }

    const warData = await response.json();

    if (warData.state === 'notInWar') {
      return NextResponse.json({ state: 'notInWar', message: 'Clan is not currently in a war' });
    }

    await connectToDatabase();

    const savedWar = await War.findOneAndUpdate(
      { 'clan.tag': warData.clan?.tag, startTime: warData.startTime },
      {
        ...warData,
        fetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Store war members
    if (warData.clan?.members) {
      for (const member of warData.clan.members) {
        const totalStars = member.attacks?.reduce((sum: number, a: Attack) => sum + (a.stars || 0), 0) || 0;
        const totalDestruction = member.attacks?.reduce((sum: number, a: Attack) => sum + (a.destructionPercentage || 0), 0) || 0;
        const attackCount = member.attacks?.length || 0;

        await WarMember.findOneAndUpdate(
          { playerTag: member.tag, warId: savedWar._id.toString() },
          {
            playerTag: member.tag,
            playerName: member.name,
            warId: savedWar._id.toString(),
            clanTag: warData.clan.tag,
            townhallLevel: member.townhallLevel,
            mapPosition: member.mapPosition,
            stars: totalStars,
            destructionPercentage: attackCount > 0 ? totalDestruction / attackCount : 0,
            attackCount,
            attacks: member.attacks || [],
            warDate: warData.startTime,
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json(savedWar);
  } catch (error) {
    console.error('Error fetching/storing war data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
