import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).set({
    name: "plataforma.token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json(
    { message: "saiu do sistema" },
    { status: 200 }
  );
}