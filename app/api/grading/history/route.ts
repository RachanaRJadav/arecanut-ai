import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const resultsCollection = db.collection("grading_results")

    const results = await resultsCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({ success: true, results }, { status: 200 })
  } catch (error) {
    console.error("History error: - route.ts:25", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
