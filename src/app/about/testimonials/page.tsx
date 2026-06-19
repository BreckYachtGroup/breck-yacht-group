// Testimonials page — add real client testimonials to the array below

const testimonials = [
  {
    name: 'Michael R.',
    location: 'Naples, FL',
    quote: 'Working with Breck Yacht Group was an exceptional experience from start to finish. They found us the perfect vessel and made the entire process seamless.',
    vessel: '2023 Yellowfin 42',
  },
  {
    name: 'James & Sarah T.',
    location: 'Palm Beach, FL',
    quote: 'The team at Breck Yacht Group truly understands the luxury market. Their attention to detail and knowledge of performance boats is unmatched.',
    vessel: '2024 Jupiter 38 FS',
  },
  {
    name: 'David K.',
    location: 'Miami, FL',
    quote: 'I have bought and sold several boats over the years and this was by far the smoothest transaction I have ever had. Highly recommend.',
    vessel: '2022 Hydra-Sports 53',
  },
]

export default function TestimonialsPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Client Stories</p>
        <h1 className="text-4xl font-bold">Testimonials</h1>
      </div>

      {/* Testimonials */}
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col gap-8">
        {testimonials.map((t, i) => (
          <div key={i} className="bg-white shadow-md p-10">
            <p className="text-4xl mb-6" style={{ color: '#c9a84c' }}>&ldquo;</p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8 italic">{t.quote}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold" style={{ color: '#0c1f3f' }}>{t.name}</p>
                <p className="text-sm text-gray-400">{t.location}</p>
              </div>
              <p className="text-xs tracking-widest uppercase text-right" style={{ color: '#c9a84c' }}>{t.vessel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
