import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { firstName, lastName, email, phone, bloodGroup, password } =
      await req.json();

    // 1. Validation
    if (!email || !password || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("madad");

    // 2. Check if user already exists
    const existingUser = await db
      .collection("users")
      .findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // 3. Hash Password for security
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create User Profile based on UI images
    const newUser = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone, // Format: +92XXXXXXXXXX
      medicalInfo: {
        bloodGroup,
      },
      password: hashedPassword,
      createdAt: new Date(),
      systemStatus: "ACTIVE",
    };

    await db.collection("users").insertOne(newUser);

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
