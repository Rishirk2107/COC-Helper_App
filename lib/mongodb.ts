import mongoose from 'mongoose';
import dns from 'node:dns';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

function isSrvLookupConnectionRefused(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeErr = error as { code?: string; syscall?: string };
  return maybeErr.code === 'ECONNREFUSED' && maybeErr.syscall === 'querySrv';
}

async function connectWithDnsFallback(mongoUri: string): Promise<typeof mongoose> {
  try {
    return await mongoose.connect(mongoUri);
  } catch (error) {
    if (!mongoUri.startsWith('mongodb+srv://') || !isSrvLookupConnectionRefused(error)) {
      throw error;
    }

    const dnsServers = process.env.MONGODB_DNS_SERVERS
      ?.split(',')
      .map((server) => server.trim())
      .filter(Boolean) ?? ['8.8.8.8', '1.1.1.1'];

    dns.setServers(dnsServers);
    return mongoose.connect(mongoUri);
  }
}

async function connectToDatabase(): Promise<typeof mongoose> {
  const rawMongoUri = process.env.MONGODB_URI;

  if (!rawMongoUri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  const MONGODB_URI = rawMongoUri.replace(/^MONGODB_URI=/, '');

  if (MONGODB_URI.startsWith('mongodb+srv://') && process.env.MONGODB_DNS_SERVERS) {
    const dnsServers = process.env.MONGODB_DNS_SERVERS
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);

    if (dnsServers.length > 0) {
      dns.setServers(dnsServers);
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithDnsFallback(MONGODB_URI).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

export default connectToDatabase;
