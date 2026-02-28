import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import War from '@/lib/models/War';

export async function GET() {
  try {
    await connectToDatabase();
    const wars = await War.find({}).sort({ fetchedAt: -1 }).limit(20).lean();
    return NextResponse.json(wars);
  } catch (error) {
    console.error('Error fetching war history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
