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
  timeline: z
    .enum(["_0_3m", "_3_6m", "_6m_plus", "Exploring"])
    .optional(),
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
  updatedAt: z.string(), // for concurrency check
});

// Helper function to format Zod validation errors
function formatZodErrors(issues: ZodIssue[]): string {
  const errors = issues.map((issue) => {
    const field = issue.path[0];
    const fieldName = typeof field === "string" ? field : "Unknown Field";
    let message = issue.message;

    switch (issue.code) {
      case "too_small":
        // The issue object for "too_small" has a 'minimum' property
        message = `Too small, must have at least ${issue.minimum} characters.`;
        break;
      case "invalid_type":
        // Type guard: Check if the issue is of type 'ZodIssueInvalidType'
        if ("received" in issue) {
          message = `Invalid type. Expected a ${issue.expected}, but got a ${issue.received}.`;
        }
        break;
      case "too_big":
        // The issue object for "too_big" has a 'maximum' property
        message = `Too large, must be less than ${issue.maximum}.`;
        break;
      default:
        message = issue.message;
    }

    const formattedField = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return `${formattedField}: ${message}`;
  });
  return errors.join(" | ");
}

// GET Buyer by ID
export async function GET(
  req: Request,
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

// UPDATE Buyer
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
      (parsed.propertyType === "Apartment" || parsed.propertyType === "Villa") &&
      !parsed.bhk
    ) {
      return NextResponse.json(
        { error: "BHK is required for Apartment or Villa." },
        { status: 400 }
      );
    }

    if (parsed.budgetMin !== undefined && parsed.budgetMax !== undefined) {
      if (parsed.budgetMax < parsed.budgetMin) {
        return NextResponse.json(
          { error: "Maximum budget must be greater than or equal to minimum budget." },
          { status: 400 }
        );
      }
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

    const updateData: any = {
      ...parsed,
      timeline: timelineValue,
    };
    delete updateData.updatedAt;

    const updated = await prisma.buyer.update({
      where: { id },
      data: updateData,
    });

    const diff: any = {};
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
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// DELETE Buyer
export async function DELETE( req: Request, context: { params: { id: string } }) {
    try {
    const { id } = context.params;

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

    // Use a transaction to ensure both operations are atomic
    await prisma.$transaction(async (tx) => {
      // 1. Create the history record first, before the buyer is deleted.
      await tx.buyerHistory.create({
        data: {
          buyerId: existing.id,
          changedBy: user.userId,
          diff: { deleted: existing },
        },
      });

      // 2. Then, delete the buyer record. The `onDelete: SetNull` or `onDelete: Cascade`
      //    you've configured will handle the foreign key.
      await tx.buyer.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Deletion Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}