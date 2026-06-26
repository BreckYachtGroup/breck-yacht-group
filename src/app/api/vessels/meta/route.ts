/**
 * /api/vessels/meta — Returns unique filter options from the proxy cache.
 * Used to populate State, Fuel Type, and Boat Type dropdowns in InventorySearch.
 */

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'

export async function GET() {
  try {
    const res = await fetch(`${PROXY_URL}/meta`, {
      next: { revalidate: 300 }, // cache 5 minutes
    })
    if (!res.ok) throw new Error(`Proxy /meta returned ${res.status}`)
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ states: [], fuelTypes: [], boatTypes: [] })
  }
}
