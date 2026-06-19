import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Get a Market Valuation',
    body: 'The first step is understanding what your vessel is worth in today\'s market. Our brokers analyze recent comparable sales, current inventory levels, and your vessel\'s specific condition and features to arrive at a realistic and competitive asking price.',
  },
  {
    number: '02',
    title: 'List With Breck Yacht Group',
    body: 'Once you\'re ready to list, we handle everything — professional photography, detailed listing creation, and distribution across our network and co-brokerage channels. Your vessel gets maximum exposure to qualified buyers.',
  },
  {
    number: '03',
    title: 'Prepare Your Vessel',
    body: 'First impressions matter. We\'ll advise you on any repairs, detailing, or staging that could meaningfully impact your sale price or time on market. Small investments here often yield significant returns.',
  },
  {
    number: '04',
    title: 'Showings & Sea Trials',
    body: 'We coordinate all showings and sea trials with serious, pre-qualified buyers — saving you time and protecting your privacy. You won\'t be fielding calls from tire-kickers.',
  },
  {
    number: '05',
    title: 'Negotiate & Accept an Offer',
    body: 'When an offer comes in, your broker will negotiate on your behalf to achieve the best possible price and terms. We\'ll walk you through every detail before you sign anything.',
  },
  {
    number: '06',
    title: 'Close the Sale',
    body: 'We manage the entire closing process — coordinating the survey, sea trial, escrow, documentation, and title transfer. Once everything is complete, funds are released and the deal is done.',
  },
]

export default function SellersGuidePage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Sell Your Vessel</p>
        <h1 className="text-4xl font-bold">Seller&apos;s Guide</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-gray-500 text-lg text-center mb-16 leading-relaxed">
          Selling a luxury vessel requires the right partner. Here&apos;s how Breck Yacht Group manages the process from valuation to closing — so you get the best outcome with the least hassle.
        </p>

        <div className="flex flex-col gap-8 mb-16">
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

        <div className="text-center">
          <p className="text-gray-500 mb-6">Ready to find out what your vessel is worth?</p>
          <Link
            href="/sell/value-my-vessel"
            className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white mr-4"
            style={{ backgroundColor: '#c9a84c' }}
          >
            Value My Vessel
          </Link>
          <Link
            href="/#contact"
            className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white"
            style={{ backgroundColor: '#0c1f3f' }}
          >
            Contact a Broker
          </Link>
        </div>
      </div>
    </div>
  )
}
