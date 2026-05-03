export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import clientPromise from "../../../lib/db.js";
const twilio = require("twilio");

// Initialize Twilio using Environment Variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

export async function PUT(req) {
  try {
    const body = await req.json();
    console.log("📥 Update & Twilio Request:", body);

    const { email, firstName, lastName, phone, bloodGroup, emergencyContact } =
      body;

    // 1. Validation
    if (!email) {
      return NextResponse.json(
        { error: "Email is required to identify the account" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("madad");

    // 2. Update User in MongoDB
    const result = await db.collection("users").findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          firstName,
          lastName,
          phone,
          "medicalInfo.bloodGroup": bloodGroup,
          emergencyContact: emergencyContact, // Saved for SOS triggers
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after", // Returns the updated document
      },
    );

    if (!result) {
      console.log("❌ User not found for email:", email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Twilio SMS Notification (Optional Confirmation)
    // We attempt this only if a contact is provided and credentials exist
    let smsSent = false;
    if (emergencyContact && accountSid && authToken && twilioPhone) {
      try {
        const twilioClient = new twilio(accountSid, authToken);

        await twilioClient.messages.create({
          body: `Madad Alert: ${firstName} ${lastName} has added you as their primary emergency contact. In case of emergency, you will receive location alerts from this number.`,
          from: twilioPhone,
          to: emergencyContact, // Works because you verified it in Dashboard
        });

        smsSent = true;
        console.log("✅ Twilio Confirmation Sent to:", emergencyContact);
      } catch (twilioError) {
        // We don't want to crash the whole request if Twilio fails (e.g. balance issues)
        console.error("⚠️ Twilio Error:", twilioError.message);
      }
    }

    console.log("✅ Profile updated for:", email);

    return NextResponse.json(
      {
        message: smsSent
          ? "Profile updated and contact notified!"
          : "Profile updated successfully!",
        user: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("🔥 UPDATE ROUTE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
