import { api } from '@/services/api';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();
    const backResponse = await api.post('/auth/login', { email, senha });
    const { token, usuario } = backResponse.data;

    (await cookies()).set({
      name: 'plataforma.token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
    });

    return NextResponse.json({ token, usuario }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error || "Erro interno" },
      { status: 500 }
    );
  }
}