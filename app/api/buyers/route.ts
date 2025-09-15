import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const buyer = await prisma.buyer.create({
      data: {
        ...body,
        owner: { connect: { id: user.userId } },
      },
    });

    await prisma.buyerHistory.create({
      data: {
        buyerId: buyer.id,
        changedBy: user.userId,
        diff: { created: buyer },
      },
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    // 1️⃣ Check auth
    console.log("Reaching here");
    const authHeader = req.headers.get("authorization");
    console.log("backend token:", authHeader);


    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const user = getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // 2️⃣ Pagination and filters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const take = 10;
    const skip = (page - 1) * take;

    const search = searchParams.get("search") || undefined;
    const city = searchParams.get("city") || undefined;
    const propertyType = searchParams.get("propertyType") || undefined;
    const status = searchParams.get("status") || undefined;
    const timeline = searchParams.get("timeline") || undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (city) where.city = city;
    if (propertyType) where.propertyType = propertyType;
    if (status) where.status = status;
    if (timeline) where.timeline = timeline;

    const [buyers, total] = await prisma.$transaction([
      prisma.buyer.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take }),
      prisma.buyer.count({ where }),
    ]);

    return NextResponse.json({ buyers, total, page, pageSize: take });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
