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
  db = client.db(process.env.DB_NAME);
  console.log(`🍃 Connected successfully to MongoDB (Database: ${process.env.DB_NAME})`);
  return db;
}

export function getDB() {
  if (!db) {
    db = client.db(process.env.DB_NAME);
  }
  return db;
}

export function getCollection(name) {
  return getDB().collection(name);
}
