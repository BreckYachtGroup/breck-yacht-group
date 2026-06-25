import Link from 'next/link'
import BoatLoanEmbed from '@/components/BoatLoanEmbed'

export default function FinancingPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Services</p>
        <h1 className="text-4xl font-bold">Financing</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-white shadow-md p-10 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#0c1f3f' }}>Marine Financing Made Simple</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Breck Yacht Group works with the industry&apos;s leading marine lenders to help you secure competitive financing for your next vessel. Whether you&apos;re a first-time buyer or an experienced owner, we&apos;ll connect you with the right lending partner for your situation.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Our preferred lenders offer flexible terms, competitive rates, and fast approvals — so you can focus on finding the perfect boat instead of navigating the paperwork.
          </p>
          <h3 className="text-lg font-bold mb-3" style={{ color: '#0c1f3f' }}>What We Can Help With</h3>
          <ul className="text-gray-600 space-y-2 mb-8">
            <li>· New and used vessel financing</li>
            <li>· Competitive fixed and variable rate options</li>
            <li>· Terms up to 20 years</li>
            <li>· Pre-approval before you shop</li>
            <li>· Refinancing existing marine loans</li>
          </ul>
          <Link
            href="/#contact"
            className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white"
            style={{ backgroundColor: '#c9a84c' }}
          >
            Speak With a Broker
          </Link>
        </div>

        {/* BoatLoan.com Application */}
        <div className="bg-white shadow-md p-6 md:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            <img
              src="/IFGLogo.jpg"
              alt="Intercoastal Financial Group"
              className="h-16 object-contain"
              width={200}
              height={64}
              fetchPriority="high"
            />
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#0c1f3f' }}>Apply for Financing</h2>
              <p className="text-gray-600 leading-relaxed">
                We are partnered with Intercoastal Financial Group for boat financing. Ready to apply for a boat loan now? Apply here and our personal agent Taylor Beckford will follow up with you directly.
              </p>
            </div>
          </div>
          <BoatLoanEmbed />
        </div>

      </div>
    </div>
  )
}
