// Testimonials page — add real client testimonials to the array below

export default function TestimonialsPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Client Stories</p>
        <h1 className="text-4xl font-bold">Testimonials</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-gray-400 text-lg">Client testimonials coming soon.</p>
        <p className="text-gray-400 mt-2">We are just getting started and look forward to sharing our clients&apos; experiences.</p>
      </div>
    </div>
  )
}
