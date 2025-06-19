'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (res.ok) {
      location.href = '/wiki'
    } else {
      const data = await res.json()
      setError(data.error || 'Login failed')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm">
        <input className="border p-2" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input className="border p-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        {error && <p className="text-red-500">{error}</p>}
        <button className="bg-blue-500 text-white p-2" type="submit">Login</button>
      </form>
    </div>
  )
}
