import type { MongoClient, ObjectId } from "mongodb"

// User Schema
export interface User {
  _id?: ObjectId
  email: string
  password: string // Hashed
  name: string
  phone?: string
  location?: string
  farmName?: string
  farmSize?: string // in acres
  createdAt: Date
  updatedAt: Date
  totalGradings: number
  averageQuality: number
  premiumPercentage: number
}

// Grading Result Schema
export interface GradingResult {
  _id?: ObjectId
  userId: string
  batchId: string
  imageUrl: string
  fileName: string
  grade: "Premium" | "Grade A" | "Grade B" | "Grade C"
  confidence: number // 0-100
  qualityScore: number // 0-10
  size: string // Small, Medium, Large
  color: string
  moistureContent: number // percentage
  defects: string[]
  marketPrice: number // ₹/kg
  recommendations: string[]
  location?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Batch Upload Schema
export interface BatchUpload {
  _id?: ObjectId
  userId: string
  batchId: string
  totalImages: number
  processedImages: number
  status: "pending" | "processing" | "completed" | "failed"
  results: GradingResult[]
  location?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Analytics Schema
export interface UserAnalytics {
  _id?: ObjectId
  userId: string
  totalSamples: number
  premiumCount: number
  gradeACount: number
  gradeBCount: number
  gradeCCount: number
  premiumPercentage: number
  averageQualityScore: number
  averagePrice: number
  monthlyTrends: Array<{
    month: string
    premium: number
    gradeA: number
    gradeB: number
    gradeC: number
    avgPrice: number
    volume: number
  }>
  gradeDistribution: {
    Premium: number
    GradeA: number
    GradeB: number
    GradeC: number
  }
  updatedAt: Date
}

// Initialize Database & Create Collections / Indexes
export async function initializeDB(client: MongoClient) {
  const db = client.db("arecanut_grading")

  const createIfNotExists = async (name: string) => {
    try {
      await db.createCollection(name)
    } catch (e) {
      // Already exists
    }
  }

  await createIfNotExists("users")
  await createIfNotExists("grading_results")
  await createIfNotExists("batch_uploads")
  await createIfNotExists("analytics")

  // Indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true })
  await db
    .collection("grading_results")
    .createIndex({ userId: 1, createdAt: -1 })
  await db
    .collection("batch_uploads")
    .createIndex({ userId: 1, createdAt: -1 })
  await db.collection("analytics").createIndex({ userId: 1 })

  return db
}
