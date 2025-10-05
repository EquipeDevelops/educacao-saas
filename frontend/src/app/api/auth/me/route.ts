import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get('plataforma.token')?.value

  if(!token) return NextResponse.json({ message: 'Token não existe' })

  return NextResponse.json({ token });
}