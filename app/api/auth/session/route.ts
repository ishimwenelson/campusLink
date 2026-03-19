import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "campuslink_secret_change_in_production"
);

export async function POST(req: Request) {
  const { uid, role } = await req.json();
  const token = await new SignJWT({ uid, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2d")
    .sign(JWT_SECRET);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("campuslink_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 2, // 2 days
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("campuslink_session");
  return res;
}
