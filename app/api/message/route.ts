import { NextResponse } from 'next/server'
import prisma from '../../../internal/prisma'
 
export async function POST(req: Request) {
  const data = await req.json()
  const result = await prisma.message.create({ data });

  return NextResponse.json(result)
}
