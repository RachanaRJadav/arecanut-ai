import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, farmName, location } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      farmName: farmName || "",
      location: location || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    return NextResponse.json(
      {
        success: true,
        userId: result.insertedId,
        message: "User registered successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error: - route.ts:47", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
