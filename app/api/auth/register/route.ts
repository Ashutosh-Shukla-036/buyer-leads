import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { hashPassword, signJwt } from "@/lib/auth";

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, password: hashed },
    });

    const token = signJwt({ userId: user.id, email: user.email });

    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
