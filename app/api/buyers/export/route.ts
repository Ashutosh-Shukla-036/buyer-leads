// app/api/buyers/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const buyers = await prisma.buyer.findMany({
      select: {
        fullName: true,
        phone: true,
        email: true,
        city: true,
        propertyType: true,
        bhk: true,
        purpose: true,
        source: true,
        status: true,
        budgetMin: true,
        budgetMax: true,
        timeline: true,
        tags: true,
        notes: true,
        updatedAt: true,
      },
    });

    const csv = Papa.unparse(buyers);

    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set("Content-Disposition", 'attachment; filename="buyers.csv"');

    return new NextResponse(csv, { status: 200, headers });

  } catch (err) {
    console.error("CSV export error:", err);
    return NextResponse.json({ error: "Failed to export buyers" }, { status: 500 });
  }
}