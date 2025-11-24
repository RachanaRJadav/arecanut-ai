// app/api/grading/analytics/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type GradingResult = {
  _id?: ObjectId | string;
  userId?: ObjectId | string;
  grade?: string;
  qualityScore?: number;
  marketPrice?: number;
  createdAt?: Date | string;
};

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const conn = await connectToDatabase();
const db = conn.db as import("mongodb").Db;
const resultsCollection = db.collection<GradingResult>("grading_results");


    // Query: try ObjectId match if possible, otherwise try string match.
    const queries = [];
    if (ObjectId.isValid(userId)) {
      queries.push({ userId: new ObjectId(userId) });
    }
    // also try string match in case userId is stored as string
    queries.push({ userId });

    // find documents that match either form (ObjectId or string)
    const results = await resultsCollection
      .find({ $or: queries })
      .toArray();

    // Helpful debug if no docs found
    if (!results || results.length === 0) {
      // return empty analytics rather than an error
      return NextResponse.json(
        {
          success: true,
          analytics: {
            totalSamples: 0,
            gradeDistribution: { Premium: 0, GradeA: 0, GradeB: 0, GradeC: 0 },
            premiumPercentage: 0,
            averageQualityScore: 0,
            averagePrice: 0,
            monthlyTrends: [],
          },
        },
        { status: 200 },
      );
    }

    const totalSamples = results.length;

    const gradeDistribution = {
      Premium: results.filter((r) => r.grade === "Premium").length,
      GradeA: results.filter((r) => r.grade === "Grade A").length,
      GradeB: results.filter((r) => r.grade === "Grade B").length,
      GradeC: results.filter((r) => r.grade === "Grade C").length,
    };

    const premiumPercentage =
      totalSamples === 0 ? 0 : (gradeDistribution.Premium / totalSamples) * 100;

    const totalQuality = results.reduce(
      (acc, r) => acc + (typeof r.qualityScore === "number" ? r.qualityScore : 0),
      0,
    );
    const averageQualityScore = totalSamples === 0 ? 0 : totalQuality / totalSamples;

    const totalPrice = results.reduce(
      (acc, r) => acc + (typeof r.marketPrice === "number" ? r.marketPrice : 0),
      0,
    );
    const averagePrice = totalSamples === 0 ? 0 : totalPrice / totalSamples;

    // (Optional) derive monthlyTrends from results or keep mock data
    const monthlyTrends = [
      { month: "Aug", samples: 1200, avgPrice: 365, premiumPercent: 28 },
      { month: "Sep", samples: 1350, avgPrice: 375, premiumPercent: 31 },
      { month: "Oct", samples: 1180, avgPrice: 370, premiumPercent: 29 },
    ];

    return NextResponse.json(
      {
        success: true,
        analytics: {
          totalSamples,
          gradeDistribution,
          premiumPercentage,
          averageQualityScore,
          averagePrice,
          monthlyTrends,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Analytics route error: - route.ts:105", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
