import { NextResponse } from "next/server";
import { uploadToGithub } from "@/lib/utils/github";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        
        
        

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "documents";
        const userId = formData.get("userId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const result = await uploadToGithub(file.name, buffer, folder);

        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
