import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import War from '@/lib/models/War';

interface WarHistoryRecord {
  _id: string;
  teamSize: number;
  fetchedAt: string;
  clan: {
    name: string;
    stars: number;
    destructionPercentage: number;
  };
  opponent: {
    name: string;
    stars: number;
    destructionPercentage: number;
  };
}


function normalizeDbWars(wars: Array<Record<string, unknown>>): WarHistoryRecord[] {
  return wars.map((war) => {
    const clan = (war.clan ?? {}) as Record<string, unknown>;
    const opponent = (war.opponent ?? {}) as Record<string, unknown>;

    const fetchedAt = war.fetchedAt instanceof Date
      ? war.fetchedAt.toISOString()
      : typeof war.fetchedAt === 'string'
        ? new Date(war.fetchedAt).toISOString()
        : new Date(0).toISOString();

    return {
      _id: String(war._id ?? `db-${fetchedAt}`),
      teamSize: Number(war.teamSize ?? 0),
      fetchedAt,
      clan: {
        name: String(clan.name ?? 'Your Clan'),
        stars: Number(clan.stars ?? 0),
        destructionPercentage: Number(clan.destructionPercentage ?? 0),
      },
      opponent: {
        name: String(opponent.name ?? 'Opponent'),
        stars: Number(opponent.stars ?? 0),
        destructionPercentage: Number(opponent.destructionPercentage ?? 0),
      },
    };
  });
}

function mergeAndSortWarHistory(dbWars: WarHistoryRecord[], warLogWars: WarHistoryRecord[]): WarHistoryRecord[] {
  const byKey = new Map<string, WarHistoryRecord>();

  for (const war of dbWars) {
    const key = war.fetchedAt;
    byKey.set(key, war);
  }

  for (const war of warLogWars) {
    const key = war.fetchedAt;
    if (!byKey.has(key)) {
      byKey.set(key, war);
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime())
    .slice(0, 20);
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeErr = error as { name?: string; code?: string; syscall?: string };

  return (
    maybeErr.name === 'MongooseServerSelectionError' ||
    maybeErr.code === 'ECONNREFUSED' ||
    maybeErr.syscall === 'querySrv'
  );
}

export async function GET() {
  try {
    await connectToDatabase();
    const clanTag = process.env.CLAN_TAG;
    const apiToken = process.env.COC_API_TOKEN;
    const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';

    const dbWarsRaw = await War.find({}).sort({ fetchedAt: -1 }).limit(50).lean();
    const dbWars = normalizeDbWars(dbWarsRaw as Array<Record<string, unknown>>);

    let warLogWars = [];
    if (clanTag && apiToken) {
      const response = await fetch(`${EXPRESS_API_URL}/api/war/history`, {
        headers: {
          'x-api-token': apiToken,
          'x-clan-tag': clanTag,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      if (response.ok) {
        const payload = await response.json();
        warLogWars = payload.items || [];
      }
    }

    const mergedWars = mergeAndSortWarHistory(dbWars, warLogWars);
    return NextResponse.json(mergedWars);
  } catch (error) {
    console.error('Error fetching war history:', error);

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: 'Database unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
