import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const { userId, amount, note, year } = await req.json();
  try {
    const paymentRef = await adminDb
      .collection("users").doc(userId)
      .collection("payments")
      .add({ amount: Number(amount), note, year, date: new Date().toISOString() });

    await adminDb.collection("users").doc(userId).update({
      paidSoFar: FieldValue.increment(Number(amount)),
    });

    return NextResponse.json({ id: paymentRef.id, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
