import Link from 'next/link'

export default function InsurancePage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Services</p>
        <h1 className="text-4xl font-bold">Insurance</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-white shadow-md p-10 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#0c1f3f' }}>Protect Your Investment</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Your vessel is a significant investment — and it deserves proper protection. Breck Yacht Group partners with top-rated marine insurance providers to ensure you have the right coverage at the right price.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            From agreed value hull coverage to liability and uninsured boater protection, we&apos;ll help you understand your options and connect you with a specialist who knows the marine market inside and out.
          </p>
          <h3 className="text-lg font-bold mb-3" style={{ color: '#0c1f3f' }}>Coverage Options</h3>
          <ul className="text-gray-600 space-y-2 mb-8">
            <li>· Agreed value hull and machinery</li>
            <li>· Liability and property damage</li>
            <li>· Uninsured/underinsured boater</li>
            <li>· Personal effects and equipment</li>
            <li>· Offshore and bluewater coverage</li>
            <li>· Charter and liveaboard policies</li>
          </ul>
          <Link
            href="/#contact"
            className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white"
            style={{ backgroundColor: '#c9a84c' }}
          >
            Get a Quote
          </Link>
        </div>
      </div>
    </div>
  )
}
