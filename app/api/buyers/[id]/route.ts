import { NextResponse } from "next/server";
import { PrismaClient, Timeline } from "@prisma/client";
import { getUserFromToken } from "@/lib/auth";
import { z, ZodIssue } from "zod";

const prisma = new PrismaClient();

const buyerUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  city: z
    .enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"])
    .optional(),
  propertyType: z
    .enum(["Apartment", "Villa", "Plot", "Office", "Retail"])
    .optional(),
  bhk: z.enum(["Studio", "One", "Two", "Three", "Four"]).optional(),
  purpose: z.enum(["Buy", "Rent"]).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  timeline: z.enum(["_0_3m", "_3_6m", "_6m_plus", "Exploring"]).optional(),
  source: z
    .enum(["Website", "Referral", "Walk_in", "Call", "Other"])
    .optional(),
  status: z
    .enum([
      "New",
      "Qualified",
      "Contacted",
      "Visited",
      "Negotiation",
      "Converted",
      "Dropped",
    ])
    .optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  updatedAt: z.string(), // concurrency check
});

// format Zod errors nicely
function formatZodErrors(issues: ZodIssue[]): string {
  return issues
    .map((issue) => {
      const field = issue.path[0];
      const fieldName = typeof field === "string" ? field : "Unknown Field";
      let message = issue.message;

      switch (issue.code) {
        case "too_small":
          message = `Too small, must have at least ${issue.minimum} characters.`;
          break;
        case "invalid_type":
          if ("received" in issue) {
            message = `Invalid type. Expected ${issue.expected}, got ${issue.received}.`;
          }
          break;
        case "too_big":
          message = `Too large, must be less than ${issue.maximum}.`;
          break;
        default:
          message = issue.message;
      }

      const formattedField =
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      return `${formattedField}: ${message}`;
    })
    .join(" | ");
}

// ---------------- GET ----------------
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const buyer = await prisma.buyer.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { changedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!buyer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formattedHistory = buyer.history.map((h) => ({
    id: h.id,
    changedAt: h.changedAt,
    changedBy: h.changedBy,
    diff: h.diff,
  }));

  return NextResponse.json({ ...buyer, history: formattedHistory });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const parsedResult = buyerUpdateSchema.safeParse(body);
    if (!parsedResult.success) {
      const formattedErrors = formatZodErrors(parsedResult.error.issues);
      return NextResponse.json({ error: formattedErrors }, { status: 400 });
    }

    const parsed = parsedResult.data;

    const existing = await prisma.buyer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }
    if (existing.ownerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      parsed.updatedAt &&
      parsed.updatedAt !== existing.updatedAt.toISOString()
    ) {
      return NextResponse.json(
        { error: "Record has been changed. Please refresh." },
        { status: 409 }
      );
    }

    if (
      (parsed.propertyType === "Apartment" ||
        parsed.propertyType === "Villa") &&
      !parsed.bhk
    ) {
      return NextResponse.json(
        { error: "BHK is required for Apartment or Villa." },
        { status: 400 }
      );
    }
    if (
      parsed.budgetMin !== undefined &&
      parsed.budgetMax !== undefined &&
      parsed.budgetMax < parsed.budgetMin
    ) {
      return NextResponse.json(
        { error: "Maximum budget must be >= minimum budget." },
        { status: 400 }
      );
    }

    const timelineMap: Record<string, Timeline> = {
      _0_3m: Timeline.ZERO_TO_THREE,
      _3_6m: Timeline.THREE_TO_SIX,
      _6m_plus: Timeline.MORE_THAN_SIX,
      Exploring: Timeline.EXPLORING,
    };
    const timelineValue = parsed.timeline
      ? timelineMap[parsed.timeline]
      : undefined;

    const updateData = {
      ...parsed,
      timeline: timelineValue,
    } as any;
    delete updateData.updatedAt;

    const updated = await prisma.buyer.update({
      where: { id },
      data: updateData,
    });

    const diff: Record<string, any> = {};
    Object.keys(updateData).forEach((key) => {
      if ((existing as any)[key] !== (updated as any)[key]) {
        diff[key] = {
          before: (existing as any)[key],
          after: (updated as any)[key],
        };
      }
    });

    if (Object.keys(diff).length > 0) {
      await prisma.buyerHistory.create({
        data: {
          buyerId: updated.id,
          changedBy: user.userId,
          diff,
        },
      });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const existing = await prisma.buyer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.ownerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.buyerHistory.create({
        data: {
          buyerId: existing.id,
          changedBy: user.userId,
          diff: { deleted: existing },
        },
      });
      await tx.buyer.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
