import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  farmName: string
  location: string
  createdAt: Date
  updatedAt: Date
}

export interface GradingResult {
  _id?: ObjectId
  userId: ObjectId | string
  batchId: string
  grade: "Premium" | "Grade A" | "Grade B" | "Grade C"
  confidence: number
  qualityScore: number
  marketPrice: number
  moistureContent: number
  size: string
  color: string
  defects: string[]
  recommendations: string[]
  imageUrl: string
  location: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Batch {
  _id?: ObjectId
  userId: ObjectId | string
  batchId: string
  totalImages: number
  processedImages: number
  status: "pending" | "processing" | "completed" | "failed"
  results: GradingResult[]
  averageQualityScore: number
  averagePrice: number
  createdAt: Date
  completedAt?: Date
}
