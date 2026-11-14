
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllResources } from '../api/resourceApi'
import ResourceCard from '../components/ResourceCard'

function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch resources from Spring Boot
  useEffect(() => {
    let isMounted = true
    let isFirstLoad = true

    async function fetchResources() {
      try {
        if (isFirstLoad && isMounted) {
          setLoading(true)
        }

        const response = await getAllResources()

        if (isMounted) {
          setResources(
            Array.isArray(response.data) ? response.data : []
          )
          setError('')
          setLastUpdated(new Date())
        }
      } catch (err) {
        console.error('Error fetching resources:', err)

        if (isMounted) {
          setError('Unable to load resources. Please try again.')
        }
      } finally {
        if (isMounted && isFirstLoad) {
          setLoading(false)
          isFirstLoad = false
        }
      }
    }

    fetchResources()

    const intervalId = setInterval(fetchResources, 10000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  // Read filters from URL
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const location = searchParams.get('location') || ''
  const availability = searchParams.get('availability') || ''
  const sort = searchParams.get('sort') || 'newest'

  // Get unique categories
  const categories = useMemo(() => {
    return [
      ...new Set(
        resources.map(resource => resource.category).filter(Boolean)
      ),
    ].sort()
  }, [resources])

  // Get unique locations
  const locations = useMemo(() => {
    return [
      ...new Set(
        resources.map(resource => resource.location).filter(Boolean)
      ),
    ].sort()
  }, [resources])

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    const filtered = resources.filter(resource => {
      const searchText = `
        ${resource.title || ''}
        ${resource.description || ''}
        ${resource.category || ''}
        ${resource.location || ''}
      `.toLowerCase()

      const matchesSearch = searchText.includes(search.trim().toLowerCase())

      const matchesCategory =
        !category || resource.category === category

      const matchesLocation =
        !location || resource.location === location

      const matchesAvailability =
        !availability ||
        String(resource.available) === availability

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation &&
        matchesAvailability
      )
    })

    // Sort by creation date
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()

      if (sort === 'oldest') {
        return dateA - dateB
      }

      return dateB - dateA
    })
  }, [
    resources,
    search,
    category,
    location,
    availability,
    sort,
  ])

  // Update URL filters
  function updateFilter(key, value) {
    const updatedParams = new URLSearchParams(searchParams)

    if (value) {
      updatedParams.set(key, value)
    } else {
      updatedParams.delete(key)
    }

    setSearchParams(updatedParams)
  }

  // Clear filters
  function clearFilters() {
    setSearchParams({})
  }

  const hasActiveFilters =
    search || category || location || availability || sort !== 'newest'

  return (
    <div className="min-h-screen bg-[#F8FBF9]">

      {/* Marketplace heading */}
      <section className="bg-[#E8F5EF] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">

          <p className="font-semibold text-amber-500">
            COMMUNITY MARKETPLACE
          </p>

          <h1 className="mt-3 text-3xl font-bold text-[#145A46] sm:text-4xl">
            Find the resources you need
          </h1>

          <p className="mt-4 max-w-2xl text-gray-600">
            Discover resources generously shared by individuals,
            volunteers, and organizations in your community.
          </p>

        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        {/* Loading and error states */}
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold text-[#145A46]">
              Loading resources...
            </p>
          </div>
        ) : error && resources.length === 0 ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            {error}

            <button
              onClick={() => window.location.reload()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>

            {/* Search and filters */}
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5">
                <h2 className="text-xl font-bold text-[#145A46]">
                  Find a Resource
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Search and filter resources according to your needs.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* Search */}
                <input
                  type="search"
                  value={search}
                  onChange={e => updateFilter('search', e.target.value)}
                  placeholder="Search resources..."
                  aria-label="Search resources"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none focus:ring-1 focus:ring-[#145A46]"
                />

                {/* Category */}
                <select
                  value={category}
                  onChange={e => updateFilter('category', e.target.value)}
                  aria-label="Filter by category"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
                >
                  <option value="">All Categories</option>

                  {categories.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {/* Location */}
                <select
                  value={location}
                  onChange={e => updateFilter('location', e.target.value)}
                  aria-label="Filter by location"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
                >
                  <option value="">All Locations</option>

                  {locations.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {/* Availability */}
                <select
                  value={availability}
                  onChange={e => updateFilter('availability', e.target.value)}
                  aria-label="Filter by availability"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
                >
                  <option value="">All Availability</option>
                  <option value="true">Available Only</option>
                  <option value="false">Unavailable</option>
                </select>

                {/* Sorting */}
                <select
                  value={sort}
                  onChange={e => updateFilter('sort', e.target.value)}
                  aria-label="Sort resources"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                <p className="text-sm text-gray-500">
                  Showing {filteredResources.length} of {resources.length} resources
                </p>

                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="font-semibold text-[#145A46] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear all filters
                </button>

              </div>

            </div>

            {/* Results heading */}
            <div className="mb-6 mt-10">

              <h2 className="text-2xl font-bold text-[#145A46]">
                Community Resources
              </h2>

              <p className="mt-2 text-gray-600">
                {filteredResources.length} resources found
              </p>

              {lastUpdated && (
                <p className="mt-2 text-xs text-gray-400">
                  Availability refreshes every 10 seconds.
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}

              {error && (
                <p className="mt-2 text-sm text-red-600">
                  Refresh failed. Showing previously loaded resources.
                </p>
              )}

            </div>

            {/* Resource cards */}
            {filteredResources.length > 0 ? (

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {filteredResources.map(resource => (
                  <ResourceCard
                    key={resource.id}
                    resource={{
                      ...resource,
                      image: resource.imageUrl || resource.image,
                    }}
                  />
                ))}

              </div>

            ) : (

              /* Empty state */
              <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm">

                <div className="text-5xl">🔍</div>

                <h3 className="mt-4 text-xl font-bold text-[#145A46]">
                  No resources found
                </h3>

                <p className="mt-2 text-gray-600">
                  Try changing your search or filters.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-[#145A46] px-6 py-3 font-medium text-white hover:bg-[#104936]"
                >
                  Clear Filters
                </button>

              </div>

            )}

          </>
        )}

      </main>
    </div>
  )
}

export default Marketplace
