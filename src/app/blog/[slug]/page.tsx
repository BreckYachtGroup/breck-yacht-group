export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  category: string
  published_at: string
}

async function getPost(slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  return (
    <div className="bg-white min-h-screen">
      {/* Cover Image */}
      {post.cover_image && (
        <div style={{ backgroundColor: '#0c1f3f' }}>
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: '480px' }}
          />
        </div>
      )}

      {/* Article */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-xs tracking-widest uppercase text-gray-400 hover:text-gray-600 mb-8 inline-block">
          ← Back to Captain's Log
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>{post.category}</span>
          <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: '#0c1f3f' }}>
          {post.title}
        </h1>

        <p className="text-lg text-gray-500 mb-10 leading-relaxed border-l-4 pl-5 italic" style={{ borderColor: '#c9a84c' }}>
          {post.excerpt}
        </p>

        {/* Post body — renders line breaks */}
        <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
          {post.content.split('\n').map((para, i) =>
            para.trim() ? <p key={i} className="mb-5">{para}</p> : null
          )}
        </div>
      </div>
    </div>
  )
}
