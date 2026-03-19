import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { BUSINESS_RULES } from "@/lib/types";

export async function POST(req: Request) {
  const { email, fullName, phone, nationalID, totalShareValue, role, accountUsed } = await req.json();

  try {
    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password: BUSINESS_RULES.DEFAULT_PASSWORD,
      displayName: fullName,
    });

    // Set custom claim for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: role || "member" });

    // Create Firestore profile
    const userData = {
      email,
      role: role || "member",
      fullName,
      phone,
      nationalID,
      createdAt: new Date().toISOString(),
      totalShareValue: totalShareValue || BUSINESS_RULES.MIN_SHARE_VALUE,
      paidSoFar: 0,
      emergencyTaken: 0,
      interestOwed: 0,
      isActive: true,
      passwordChanged: false,
      documentsUploaded: false,
      accountUsed: accountUsed || "",
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userData);

    return NextResponse.json({ uid: userRecord.uid, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
