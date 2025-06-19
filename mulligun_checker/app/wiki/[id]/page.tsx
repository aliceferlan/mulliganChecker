'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Article { id: number; title: string; content: string; author_id: number }
interface Comment { id: number; content: string; created_at: string; username: string }

export default function ArticlePage() {
  const params = useParams()
  const id = params?.id as string
  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    fetch(`/api/wiki/${id}`).then(res => res.json()).then(data => {
      setArticle(data.article)
      setComments(data.comments)
      setEditTitle(data.article.title)
      setEditContent(data.article.content)
    })
  }, [id])

  const submitComment = async () => {
    const res = await fetch(`/api/wiki/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment })
    })
    if (res.ok) {
      const data = await res.json()
      setComments([...comments, { id: Date.now(), content: newComment, created_at: new Date().toISOString(), username: 'You' }])
      setNewComment('')
    }
  }

  const saveEdit = async () => {
    const res = await fetch(`/api/wiki/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editContent })
    })
    if (res.ok) {
      setArticle({ ...article!, title: editTitle, content: editContent })
      setEditMode(false)
    }
  }

  if (!article) return <p>Loading...</p>

  return (
    <div className="p-4">
      {editMode ? (
        <div className="mb-4">
          <input className="border p-2 w-full" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
          <textarea className="border p-2 w-full mt-2" rows={10} value={editContent} onChange={e => setEditContent(e.target.value)} />
          <button className="bg-green-600 text-white p-2 mt-2" onClick={saveEdit}>Save</button>
        </div>
      ) : (
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
          <div className="prose" dangerouslySetInnerHTML={{ __html: article.content }} />
          <button className="text-blue-500" onClick={() => setEditMode(true)}>Edit</button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Comments</h2>
        <ul className="space-y-2">
          {comments.map(c => (
            <li key={c.id} className="border p-2">
              <div className="text-sm text-gray-600">{c.username} - {new Date(c.created_at).toLocaleString()}</div>
              <div>{c.content}</div>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input className="border flex-1 p-2" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment" />
          <button className="bg-blue-500 text-white p-2" onClick={submitComment}>Post</button>
        </div>
      </div>
    </div>
  )
}
