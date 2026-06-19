// Crew page — add your team members to the `crew` array below

const crew = [
  {
    name: 'Austin Huebner',
    title: 'Founder & Lead Broker',
    bio: 'With years of experience in the luxury performance boat market, Austin founded Breck Yacht Group with a vision to bring a higher standard of service to yacht brokerage.',
    photo: '', // add a photo URL here
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
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-6"
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
