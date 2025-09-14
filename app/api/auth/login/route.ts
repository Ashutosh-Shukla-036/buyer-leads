import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { comparePassword, signJwt } from "@/lib/auth";

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const token = signJwt({ userId: user.id, email: user.email });

    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
