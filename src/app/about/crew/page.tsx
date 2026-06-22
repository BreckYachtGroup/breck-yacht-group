// Crew page — add your team members to the `crew` array below

const crew = [
  {
    name: 'Austin Huebner',
    title: 'Founder & Lead Broker',
    bio: 'I am a professional yacht broker and entrepreneur in Palm Beach, Florida. As a qualified yacht broker, I plan to establish myself as the tech-forward leader in the luxury vessel market. My career is defined by my deep understanding of boat performance, valuation, and restoration. I have spent significant time working on and running high-performance center consoles and luxury yachts. I have launched Breck Yacht Group as a hybrid platform designed to bridge the gap between traditional white-glove brokerage services and the efficiency of high-volume online boat sales.',
    photo: 'https://i.imgur.com/qzLnErw.jpg',
  },
  // Add more crew members here
]

export default function CrewPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>The Team</p>
        <h1 className="text-4xl font-bold">Our Crew</h1>
      </div>

      {/* Crew Grid */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {crew.map((member) => (
            <div key={member.name} className="bg-white shadow-md text-center p-8">
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-28 h-28 rounded-full object-cover object-top mx-auto mb-6"
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold"
                  style={{ backgroundColor: '#0c1f3f' }}
                >
                  {member.name.charAt(0)}
                </div>
              )}
              <h2 className="text-xl font-bold mb-1" style={{ color: '#0c1f3f' }}>{member.name}</h2>
              <p className="text-xs tracking-widest uppercase mb-4" style={{ color: '#c9a84c' }}>{member.title}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
