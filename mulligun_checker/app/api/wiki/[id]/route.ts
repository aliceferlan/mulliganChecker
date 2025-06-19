import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { currentUser } from '@/app/lib/auth'

export async function GET(req: Request, context: any) {
  const { params } = context
  const id = params.id
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id)
  const comments = db.prepare('SELECT c.id, c.content, c.created_at, u.username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.article_id = ? ORDER BY c.created_at').all(id)
  return NextResponse.json({ article, comments })
}

export async function PUT(req: Request, context: any) {
  const { params } = context
  const user = currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = params.id
  const { title, content } = await req.json()
  const now = new Date().toISOString()
  db.prepare('UPDATE articles SET title = ?, content = ?, updated_at = ? WHERE id = ?').run(title, content, now, id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, context: any) {
  const { params } = context
  const user = currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = params.id
  db.prepare('DELETE FROM articles WHERE id = ?').run(id)
  return NextResponse.json({ success: true })
}
