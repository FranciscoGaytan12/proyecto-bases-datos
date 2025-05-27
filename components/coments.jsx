"use client"

import { useState, useEffect } from 'react'
import { Button } from "/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "/components/ui/card"
import { Input } from "/components/ui/input"
import { Textarea } from "/components/ui/textarea"
import { User, MessageSquare } from "lucide-react"
import { commentService } from "../services/comment-service"

export default function CommentSystem() {
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [reference, setReference] = useState('')
  const [comments, setComments] = useState([]) // Initialize as empty array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadComments = async () => {
    try {
      const data = await commentService.getComments()
      setComments(data || []) // Ensure it's always an array
    } catch (err) {
      console.error("Error loading comments:", err)
      setError("Error al cargar los comentarios")
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !comment.trim()) {
      setError('Please fill in all required fields')
      return
    }
    setError('')
    try {
      const newComment = {
        name,
        comment,
        reference,
      }
      await commentService.createComment(newComment)
      await loadComments() // Reload comments after creating new one
      setName('')
      setComment('')
      setReference('')
    } catch (err) {
      console.error("Error creating comment:", err)
      setError('Error al guardar el comentario')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Leave a Comment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="comment" className="block text-sm font-medium">
                Comment <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="comment"
                placeholder="Share your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reference" className="block text-sm font-medium">
                Reference (optional)
              </label>
              <Input
                id="reference"
                placeholder="URL or source"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">Post Comment</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h2>
        
        {loading ? (
          <p className="text-gray-500">Cargando comentarios...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''} at{' '}
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="whitespace-pre-line">{item.comment}</p>
                  {item.reference && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Reference:</span> {item.reference}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

