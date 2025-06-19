import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  const user = login(username, password)
  if (user) {
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
