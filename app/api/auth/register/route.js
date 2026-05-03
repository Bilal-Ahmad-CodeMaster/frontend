export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
// import clientPromise from '../../../lib/db.js'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const body = await req.json()
    console.log("📥 Received:", body)

    const { firstName, lastName, email, phone, bloodGroup, password } = body

    // Validation
    if (!email || !password || !phone) {
      console.log("❌ Missing fields")
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("madad")

    // Check if user exists
    const existingUser = await db
      .collection("users")
      .findOne({ email: email.toLowerCase() })
    
    if (existingUser) {
      console.log("❌ User already exists")
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      medicalInfo: { bloodGroup: bloodGroup || 'Unknown' },
      password: hashedPassword,
      createdAt: new Date(),
      systemStatus: "ACTIVE",
    }

    await db.collection("users").insertOne(newUser)
    console.log("✅ User created:", email)

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    )

  } catch (error) {
    console.error("🔥 ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}