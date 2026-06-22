export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string
  cover_image: string
  category: string
  published_at: string
}

async function getPosts(): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, category, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
  return data ?? []
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>News & Insights</p>
        <h1 className="text-4xl font-bold">Captain's Log</h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {posts.length === 0 ? (
          <p className="text-center text-gray-400 py-20 text-lg">No posts yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-white shadow-md hover:shadow-xl transition-all duration-300">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 overflow-hidden"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center" style={{ backgroundColor: '#0c1f3f' }}>
                    <span className="text-white/20 text-sm tracking-widest uppercase">Breck Yacht Group</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>{post.category}</span>
                    <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
                  </div>
                  <h2 className="text-lg font-bold mb-2 group-hover:opacity-70 transition-opacity" style={{ color: '#0c1f3f' }}>{post.title}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
