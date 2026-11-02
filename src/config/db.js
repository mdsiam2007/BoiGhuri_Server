import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

export async function connectDB() {
  await client.connect();
  const dbName = process.env.DB_NAME || 'boighuri';
  db = client.db(dbName);
  console.log(`🍃 Connected successfully to MongoDB (Database: ${dbName})`);
  return db;
}

export function getDB() {
  if (!db) {
    db = client.db(process.env.DB_NAME || 'boighuri');
  }
  return db;
}

export function getCollection(name) {
  return getDB().collection(name);
}
