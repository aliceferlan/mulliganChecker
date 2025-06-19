import { NextResponse } from 'next/server'
import { logout } from '@/app/lib/auth'

export async function POST() {
  logout()
  return NextResponse.json({ success: true })
}
