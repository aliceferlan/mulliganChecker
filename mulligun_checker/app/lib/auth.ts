import { cookies } from 'next/headers'
import db from './db'

const cookieName = 'wiki_user'

export function login(username: string, password: string): {id: number, username: string} | null {
  const stmt = db.prepare('SELECT id, username, password FROM users WHERE username = ?')
  const row = stmt.get(username)
  if (row && row.password === password) {
    cookies().set(cookieName, String(row.id))
    return { id: row.id, username: row.username }
  }
  return null
}

export function logout() {
  cookies().delete(cookieName)
}

export function currentUser(): {id: number, username: string} | null {
  const id = cookies().get(cookieName)?.value
  if (!id) return null
  const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?')
  const row = stmt.get(id)
  if (row) return { id: row.id, username: row.username }
  return null
}
