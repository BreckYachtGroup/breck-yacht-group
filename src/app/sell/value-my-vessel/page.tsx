import ValuationForm from '@/components/ValuationForm'

export default function ValueMyVesselPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Sell Your Vessel</p>
        <h1 className="text-4xl font-bold">Value My Vessel</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-gray-500 text-lg text-center mb-12 leading-relaxed">
          Get a complimentary market valuation from our team. Fill out the form below and a Breck Yacht Group broker will be in touch within 24 hours with a detailed assessment of your vessel&apos;s current market value.
        </p>

        <div className="bg-white shadow-md p-10">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0c1f3f' }}>Tell Us About Your Vessel</h2>
          <ValuationForm />
        </div>
      </div>
    </div>
  )
}
