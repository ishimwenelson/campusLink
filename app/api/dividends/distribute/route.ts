import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { distributeDividends, updateDividendProject, getDividendProject } from "@/lib/firebase/firestore";
import { createNotification } from "@/lib/firebase/firestore";
import { getAllUsers } from "@/lib/firebase/firestore";
import { getShareCount } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await auth.verifyIdToken(token);
    if (decoded.role !== "president") {
      return NextResponse.json({ error: "Only presidents can distribute dividends" }, { status: 403 });
    }

    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    
    const project = await getDividendProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.profit <= 0) {
      return NextResponse.json({ error: "No profit available to distribute" }, { status: 400 });
    }

    
    const users = await getAllUsers();
    const totalShares = users.reduce((sum, user) => sum + getShareCount(user.totalShareValue), 0);
    const perShareAmount = project.profit / totalShares;

    
    await distributeDividends(projectId, perShareAmount);
    
    
    await updateDividendProject(projectId, { status: 'completed' });

    
    const notifications = users
      .filter(user => getShareCount(user.totalShareValue) > 0)
      .map(user => ({
        userId: user.uid,
        title: "Dividend Distributed! ",
        message: `You've received ${perShareAmount.toFixed(2)} RF per share from ${project.name}. Total: ${(getShareCount(user.totalShareValue) * perShareAmount).toFixed(2)} RF`,
        type: "dividend_distributed" as const,
        read: false,
        createdAt: new Date().toISOString(),
      }));

    
    await Promise.all(notifications.map(notif => createNotification(notif)));

    return NextResponse.json({
      success: true,
      message: `Dividends distributed successfully! ${perShareAmount.toFixed(2)} RF per share`,
      perShareAmount,
      totalDistributed: project.profit,
      recipients: users.filter(user => getShareCount(user.totalShareValue) > 0).length,
    });

  } catch (error: any) {
    console.error("Dividend distribution error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to distribute dividends" },
      { status: 500 }
    );
  }
}
