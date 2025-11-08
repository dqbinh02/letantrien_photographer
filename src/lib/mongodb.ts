import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'photographer';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongoDBCache {
  client: MongoClient | null;
  db: Db | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoCache: MongoDBCache | undefined;
}

const cached: MongoDBCache = global.mongoCache || { client: null, db: null };

if (!global.mongoCache) {
  global.mongoCache = cached;
}

export async function connectToDatabase() {
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cached.client = client;
  cached.db = db;

  return { client, db };
}
