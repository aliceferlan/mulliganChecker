import { NextRequest, NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { currentUser } from '@/app/lib/auth'

export async function GET() {
  const rows = db.prepare('SELECT id, title, created_at FROM articles ORDER BY created_at DESC').all()
  return NextResponse.json({ articles: rows })
}

export async function POST(req: NextRequest) {
  const user = currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, content } = await req.json()
  const now = new Date().toISOString()
  const stmt = db.prepare('INSERT INTO articles (title, content, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
  const info = stmt.run(title, content, user.id, now, now)
  return NextResponse.json({ id: info.lastInsertRowid })
}
