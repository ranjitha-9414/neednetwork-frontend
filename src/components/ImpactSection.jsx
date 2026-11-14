
import { useEffect, useState } from 'react'
import API_BASE_URL from "../api/apiConfig";

function ImpactSection() {
  const [stats, setStats] = useState({
    resourcesShared: 0,
    peopleSupported: 0,
    communityVolunteers: 0,
    partnerNgos: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/home/statistics`
        )

        if (!response.ok) {
          throw new Error('Unable to fetch statistics')
        }

        const data = await response.json()

        setStats({
          resourcesShared: data.resourcesShared,
          peopleSupported: data.peopleSupported,
          communityVolunteers: data.communityVolunteers,
          partnerNgos: data.partnerNgos,
        })
      } catch (err) {
        console.error('Statistics API error:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  const impactStats = [
    {
      number: stats.resourcesShared,
      label: 'Resources Shared',
    },
    {
      number: stats.peopleSupported,
      label: 'People Supported',
    },
    {
      number: stats.communityVolunteers,
      label: 'Community Volunteers',
    },
    {
      number: stats.partnerNgos,
      label: 'Partner NGOs',
    },
  ]

  return (
    <section className="bg-[#145A46] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Together, we're making a difference
          </h2>

          <p className="mt-4 text-green-100">
            Every contribution matters. Every connection creates hope.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {impactStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-amber-400 md:text-4xl">
                {loading
                  ? '...'
                  : error
                    ? '—'
                    : `${Number(stat.number).toLocaleString('en-IN')}+`}
              </p>

              <p className="mt-3 text-green-100">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ImpactSection
