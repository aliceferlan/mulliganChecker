'use client'
import { useEffect, useState } from 'react'

interface Article { id: number; title: string; created_at: string }

export default function WikiList() {
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    fetch('/api/wiki').then(res => res.json()).then(data => setArticles(data.articles))
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MTG Wiki</h1>
      <a href="/wiki/new" className="text-blue-500">Create New Article</a>
      <ul className="mt-4 space-y-2">
        {articles.map(a => (
          <li key={a.id}>
            <a href={`/wiki/${a.id}`} className="text-blue-600 hover:underline">{a.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
