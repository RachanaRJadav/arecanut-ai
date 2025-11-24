import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || ""
let cachedClient: MongoClient | null = null
let cachedDb: any = null

if (!process.env.MONGODB_URI) {
  throw new Error("Please define MONGODB_URI environment variable")
}

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(uri)

  await client.connect()
  const db = client.db("arecanut-grading")

  cachedClient = client
  cachedDb = db

  return { client, db }
}
