import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import War from '@/lib/models/War';

interface CocApiError {
  reason?: string;
  message?: string;
}

interface CurrentWarResponse {
  state?: string;
  startTime?: string;
  [key: string]: unknown;
}

async function fetchCurrentWar(clanTag: string, apiToken: string): Promise<{ ok: true; data: CurrentWarResponse } | { ok: false; status: number; error: CocApiError | { message: string } }> {
  const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';
  const response = await fetch(`${EXPRESS_API_URL}/api/cron/save-war`, {
    headers: {
      'x-api-token': apiToken,
      'x-clan-tag': clanTag,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorPayload: CocApiError | { message: string } = { message: 'Unknown Express API error' };
    try {
      errorPayload = (await response.json()) as CocApiError;
    } catch {
      errorPayload = { message: `Express API request failed with status ${response.status}` };
    }

    return {
      ok: false,
      status: response.status,
      error: errorPayload,
    };
  }

  const payload = (await response.json()) as CurrentWarResponse;
  return { ok: true, data: payload };
}

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

    const currentWarResult = await fetchCurrentWar(clanTag, apiToken);

    if (!currentWarResult.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch current war from COC API',
          details: currentWarResult.error,
        },
        { status: currentWarResult.status }
      );
    }

    const warData = currentWarResult.data;

    if (warData.state !== 'warEnded') {
      return NextResponse.json({
        status: 'skipped',
        message: `War state is '${warData.state ?? 'unknown'}'. Snapshot saved only when state is 'warEnded'.`,
      });
    }

    if (!warData.startTime) {
      return NextResponse.json(
        { error: 'Invalid war payload: missing startTime' },
        { status: 422 }
      );
    }

    await connectToDatabase();

    const existingWar = await War.findOne({ startTime: warData.startTime }).select('_id').lean();

    if (existingWar) {
      return NextResponse.json({
        status: 'already_saved',
        message: 'War snapshot already exists for this startTime.',
        startTime: warData.startTime,
      });
    }

    try {
      const savedWar = await War.create({
        ...warData,
        fetchedAt: new Date(),
      });

      return NextResponse.json({
        status: 'saved',
        message: 'War snapshot saved successfully.',
        id: savedWar._id,
        startTime: warData.startTime,
      });
    } catch (mongoError: unknown) {
      const duplicateKeyError = mongoError as { code?: number };

      if (duplicateKeyError.code === 11000) {
        return NextResponse.json({
          status: 'already_saved',
          message: 'War snapshot already exists for this startTime.',
          startTime: warData.startTime,
        });
      }

      throw mongoError;
    }
  } catch (error) {
    console.error('Error saving ended war snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
