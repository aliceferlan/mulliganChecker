'use client'
import { useState } from 'react'

export default function NewArticle() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/wiki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    })
    if (res.ok) {
      const data = await res.json()
      location.href = `/wiki/${data.id}`
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">New Article</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-lg">
        <input className="border p-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <textarea className="border p-2" rows={10} value={content} onChange={e => setContent(e.target.value)} placeholder="Content" />
        {error && <p className="text-red-500">{error}</p>}
        <button className="bg-green-600 text-white p-2" type="submit">Create</button>
      </form>
    </div>
  )
}
