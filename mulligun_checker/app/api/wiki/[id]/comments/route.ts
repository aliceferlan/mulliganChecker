import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { currentUser } from '@/app/lib/auth'

export async function POST(req: Request, context: any) {
  const { params } = context
  const user = currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = params.id
  const { content } = await req.json()
  const now = new Date().toISOString()
  db.prepare('INSERT INTO comments (article_id, author_id, content, created_at) VALUES (?, ?, ?, ?)').run(id, user.id, content, now)
  return NextResponse.json({ success: true })
}
