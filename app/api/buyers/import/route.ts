import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { PrismaClient, Purpose, Source } from "@prisma/client";
import { getUserFromToken } from "@/lib/auth"; // Assuming you have a function to get the user from the token

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Get the token from the Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    // 2. Decode the token to get the user ID
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 });
    }

    // 3. Use the authenticated user's ID for all imported buyers
    const buyersToCreate = data.map((row: any) => ({
      fullName: row.fullName,
      phone: row.phone,
      email: row.email || null,
      city: row.city,
      propertyType: row.propertyType,
      budgetMin: row.budgetMin ? parseInt(row.budgetMin, 10) : null,
      budgetMax: row.budgetMax ? parseInt(row.budgetMax, 10) : null,
      timeline: row.timeline,
      status: row.status,
      ownerId: user.userId, // Use the authenticated user's ID from the token
      purpose: row.purpose as Purpose,
      source: row.source as Source,
    }));

    const created = await prisma.buyer.createMany({
      data: buyersToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: `Imported ${created.count} buyers` });
  } catch (err) {
    console.error("CSV import error:", err);
    return NextResponse.json({ error: "Failed to import buyers" }, { status: 500 });
  }
}