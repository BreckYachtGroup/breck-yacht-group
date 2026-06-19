import Link from 'next/link'

export default function YachtManagementPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Services</p>
        <h1 className="text-4xl font-bold">Yacht Management</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-white shadow-md p-10 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#0c1f3f' }}>Full-Service Vessel Management</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Owning a high-performance vessel should be a pleasure — not a second job. Breck Yacht Group offers comprehensive yacht management services so your boat is always ready when you are.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            From routine maintenance scheduling to crew coordination and storage, our team handles every detail so you can spend more time on the water and less time on logistics.
          </p>
          <h3 className="text-lg font-bold mb-3" style={{ color: '#0c1f3f' }}>Our Management Services</h3>
          <ul className="text-gray-600 space-y-2 mb-8">
            <li>· Routine maintenance scheduling and oversight</li>
            <li>· Storage and seasonal preparation</li>
            <li>· Vendor and contractor coordination</li>
            <li>· Crew sourcing and management</li>
            <li>· Fuel, dockage, and slip management</li>
            <li>· Monthly condition reports</li>
            <li>· Insurance and registration management</li>
          </ul>
          <Link
            href="/#contact"
            className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white"
            style={{ backgroundColor: '#c9a84c' }}
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  )
}
