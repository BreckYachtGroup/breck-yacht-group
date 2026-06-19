import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Define Your Needs',
    body: 'Start by identifying how you plan to use your vessel. Are you offshore fishing, day cruising, entertaining, or all of the above? Your intended use will drive nearly every decision — from hull type and length to engine configuration and electronics.',
  },
  {
    number: '02',
    title: 'Set Your Budget',
    body: 'Factor in not just the purchase price but the total cost of ownership: insurance, dockage, fuel, maintenance, and storage. A good rule of thumb is to budget 10–15% of the vessel\'s value annually for ongoing costs. Pre-approval from a marine lender can also strengthen your position when making an offer.',
  },
  {
    number: '03',
    title: 'Work With a Broker',
    body: 'A qualified yacht broker protects your interests throughout the entire transaction. Your broker will help you identify the right vessels, negotiate price, arrange sea trials, coordinate surveys, and manage all closing paperwork — at no cost to you as the buyer.',
  },
  {
    number: '04',
    title: 'Sea Trial & Survey',
    body: 'Never purchase a vessel without a sea trial and a professional marine survey. A certified marine surveyor will inspect the hull, engines, electrical systems, and all onboard equipment — giving you an objective assessment of the vessel\'s true condition and value.',
  },
  {
    number: '05',
    title: 'Make an Offer',
    body: 'Once you\'ve found the right boat and completed due diligence, your broker will help you structure a competitive offer. This includes negotiating price, terms, and any items to be included or excluded from the sale.',
  },
  {
    number: '06',
    title: 'Close & Hit the Water',
    body: 'After all conditions are met, funds are transferred, documentation is signed, and the vessel is officially yours. Your broker will walk you through registration, titling, and any final steps to ensure a smooth transition of ownership.',
  },
]

export default function BuyingGuidePage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Services</p>
        <h1 className="text-4xl font-bold">Buyer's Guide</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-gray-500 text-lg text-center mb-16 leading-relaxed">
          Purchasing a luxury performance vessel is one of the most exciting decisions you&apos;ll make. Here&apos;s a step-by-step overview of how the process works when you work with Breck Yacht Group.
        </p>

        <div className="flex flex-col gap-8">
          {steps.map((step) => (
            <div key={step.number} className="bg-white shadow-md p-8 flex gap-6">
              <div className="text-4xl font-bold shrink-0" style={{ color: '#c9a84c' }}>{step.number}</div>
              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>{step.title}</h2>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 mb-6">Ready to start your search?</p>
          <Link
            href="/inventory"
            className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white mr-4"
            style={{ backgroundColor: '#0c1f3f' }}
          >
            Browse Inventory
          </Link>
          <Link
            href="/#contact"
            className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white"
            style={{ backgroundColor: '#c9a84c' }}
          >
            Contact a Broker
          </Link>
        </div>
      </div>
    </div>
  )
}
