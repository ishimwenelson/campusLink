
"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./config";
import type { UserRole } from "@/lib/types";

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function changePassword(newPassword: string) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  return updatePassword(auth.currentUser, newPassword);
}

export async function getIdTokenClaims(): Promise<{
  role?: UserRole;
} | null> {
  if (!auth.currentUser) return null;
  const result = await auth.currentUser.getIdTokenResult(true);
  return result.claims as { role?: UserRole };
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
