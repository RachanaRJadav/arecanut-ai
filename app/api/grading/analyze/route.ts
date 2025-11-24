import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { GradingResult } from "@/lib/models"
import { ObjectId } from "mongodb"

function simulateAIGrading() {
  const grades = ["Premium", "Grade A", "Grade B", "Grade C"]
  const sizes = ["Large (18-20mm)", "Medium (16-18mm)", "Small (14-16mm)"]
  const colors = ["Golden Brown", "Light Brown", "Brown", "Dark Brown"]
  const defectsPool = ["Minor surface marks", "Slight discoloration", "Small cracks", "Surface blemishes"]

  const grade = grades[Math.floor(Math.random() * grades.length)]
  const confidence = 85 + Math.random() * 15
  const qualityScore = 6 + Math.random() * 4
  const marketPrice = 280 + Math.random() * 200
  const moistureContent = 12 + Math.random() * 4
  const size = sizes[Math.floor(Math.random() * sizes.length)]
  const color = colors[Math.floor(Math.random() * colors.length)]
  const defects = Math.random() > 0.7 ? [defectsPool[Math.floor(Math.random() * defectsPool.length)]] : []

  const recommendations = [
    "Maintain current drying process",
    "Store in moisture-controlled environment",
    "Improve sorting process",
    "Check drying temperature",
  ].slice(0, Math.floor(Math.random() * 2) + 2)

  return {
    grade,
    confidence,
    qualityScore,
    marketPrice,
    moistureContent,
    size,
    color,
    defects,
    recommendations,
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const userId = formData.get("userId") as string
    const batchId = formData.get("batchId") as string
    const location = formData.get("location") as string
    const notes = formData.get("notes") as string

    if (!files || files.length === 0 || !userId) {
      return NextResponse.json({ error: "Missing files or userId" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const resultsCollection = db.collection("grading_results")
    const batchesCollection = db.collection("batches")

    // Create batch record
    const batchRecord = {
      userId: new ObjectId(userId),
      batchId,
      totalImages: files.length,
      processedImages: 0,
      status: "processing",
      results: [],
      averageQualityScore: 0,
      averagePrice: 0,
      createdAt: new Date(),
    }

    const batchResult = await batchesCollection.insertOne(batchRecord)

    const results: GradingResult[] = []
    let totalQualityScore = 0
    let totalPrice = 0

    // Process each image
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const aiResults = simulateAIGrading()

      const gradingResult: GradingResult = {
        userId: new ObjectId(userId),
        batchId,
        grade: aiResults.grade as any,
        confidence: Number.parseFloat(aiResults.confidence.toFixed(2)),
        qualityScore: Number.parseFloat(aiResults.qualityScore.toFixed(2)),
        marketPrice: Number.parseFloat(aiResults.marketPrice.toFixed(0)),
        moistureContent: Number.parseFloat(aiResults.moistureContent.toFixed(2)),
        size: aiResults.size,
        color: aiResults.color,
        defects: aiResults.defects,
        recommendations: aiResults.recommendations,
        imageUrl: `/images/arecanut-${Date.now()}-${i}.jpg`,
        location: location || "Unknown",
        notes: notes || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const insertResult = await resultsCollection.insertOne(gradingResult)
      results.push({ ...gradingResult, _id: insertResult.insertedId })

      totalQualityScore += aiResults.qualityScore
      totalPrice += aiResults.marketPrice
    }

    // Update batch with results
    const averageQualityScore = Number.parseFloat((totalQualityScore / files.length).toFixed(2))
    const averagePrice = Number.parseFloat((totalPrice / files.length).toFixed(0))

    await batchesCollection.updateOne(
      { _id: batchResult.insertedId },
      {
        $set: {
          status: "completed",
          processedImages: files.length,
          results: results.map((r) => r._id),
          averageQualityScore,
          averagePrice,
          completedAt: new Date(),
        },
      },
    )

    return NextResponse.json(
      {
        success: true,
        batchId,
        results,
        summary: {
          totalImages: files.length,
          averageQualityScore,
          averagePrice,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Grading error: - route.ts:140", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
