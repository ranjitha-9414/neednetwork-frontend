
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRequestsByEmail } from '../api/resourceApi'

const statuses = ['All', 'Pending', 'Approved', 'Returned', 'Rejected']

function getStatusStyle(status) {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'RETURNED':
      return 'bg-blue-100 text-blue-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

function getUrgencyStyle(level) {
  switch (level?.toUpperCase()) {
    case 'EMERGENCY':
      return 'bg-red-100 text-red-800'
    case 'URGENT':
      return 'bg-orange-100 text-orange-800'
    case 'PLANNED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function formatDate(dateValue, includeTime = false) {
  if (!dateValue) return 'Not available'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  })
}

function getRequestMessage(status) {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return 'Your request has been approved. Please coordinate with the resource provider.'

    case 'RETURNED':
      return 'The resource has been returned successfully. Thank you for using NeedNetwork.'

    case 'REJECTED':
      return 'This request was not approved. You can explore other resources.'

    default:
      return 'Your request is waiting for review.'
  }
}

function MyRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Fetch requests belonging to the authenticated user
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await getRequestsByEmail()

      const data = response.data

      if (!Array.isArray(data)) {
        throw new Error('Unexpected response received from the server.')
      }

      // Show newest requests first
      const sortedRequests = [...data].sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })

      setRequests(sortedRequests)
    } catch (err) {
      console.error('Error fetching requests:', err)

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load your requests. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Count requests by status
  function getStatusCount(status) {
    if (status === 'All') return requests.length

    return requests.filter(
      request =>
        request.status?.toUpperCase() === status.toUpperCase()
    ).length
  }

  // Search and filter requests
  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return requests.filter(request => {
      const matchesStatus =
        selectedStatus === 'All' ||
        request.status?.toUpperCase() === selectedStatus.toUpperCase()

      const searchableText = [
        request.id,
        request.resource?.title,
        request.resource?.category,
        request.resource?.location,
        request.reason,
        request.urgencyLevel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !term || searchableText.includes(term)

      return matchesStatus && matchesSearch
    })
  }, [requests, selectedStatus, searchTerm])

  function clearFilters() {
    setSearchTerm('')
    setSelectedStatus('All')
  }

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Assistance Requests
            </h1>

            <p className="mt-2 text-gray-600">
              Track the status of resources you have requested.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchRequests}
              disabled={loading}
              className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>

            <Link
              to="/resources"
              className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              + Find Resources
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />
            <p className="text-gray-600">
              Loading your requests...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-red-600">{error}</p>

            <button
              type="button"
              onClick={fetchRequests}
              className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Dashboard */}
        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {statuses.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                    selectedStatus === status
                      ? 'border-green-600 ring-2 ring-green-100'
                      : 'border-transparent'
                  }`}
                >
                  <p className="text-sm text-gray-500">
                    {status === 'All' ? 'Total Requests' : status}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {getStatusCount(status)}
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    View {status.toLowerCase()}
                  </p>
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
              <label
                htmlFor="requestSearch"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Search your requests
              </label>

              <input
                id="requestSearch"
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search resource, category, reason or request ID..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-sm font-medium text-gray-700">
                  Filter:
                </span>

                {statuses.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      selectedStatus === status
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto text-sm font-semibold text-red-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Your Requests
              </h2>

              <p className="text-sm text-gray-500">
                Showing {filteredRequests.length} of {requests.length}
              </p>
            </div>

            {/* No Requests */}
            {requests.length === 0 && (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <div className="mb-3 text-5xl">📦</div>

                <h2 className="text-xl font-bold text-gray-800">
                  No requests yet
                </h2>

                <p className="mt-2 text-gray-600">
                  Explore available resources and request the help you need.
                </p>

                <Link
                  to="/resources"
                  className="mt-5 inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
                >
                  Explore Resources
                </Link>
              </div>
            )}

            {/* No Matching Requests */}
            {requests.length > 0 && filteredRequests.length === 0 && (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">
                  No matching requests
                </h2>

                <p className="mt-2 text-gray-600">
                  Try another search term or status filter.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 font-semibold text-green-700 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Request Cards */}
            {filteredRequests.length > 0 && (
              <div className="space-y-4">
                {filteredRequests.map(request => (
                  <article
                    key={request.id}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="mb-1 text-sm font-medium text-green-700">
                          {request.resource?.category || 'Uncategorized'}
                        </p>

                        <h2 className="text-xl font-bold text-gray-900">
                          {request.resource?.title || 'Resource'}
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                          Request ID: #{request.id}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Request date: {formatDate(request.createdAt)}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          📍 {request.resource?.location || 'Location not available'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {request.urgencyLevel && (
                          <span className={`rounded-full px-3 py-2 text-xs font-semibold ${getUrgencyStyle(request.urgencyLevel)}`}>
                            {request.urgencyLevel}
                          </span>
                        )}

                        <span className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusStyle(request.status)}`}>
                          {request.status || 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2">
                      <p className="text-sm text-gray-600">
                        <strong>Duration:</strong>{' '}
                        {request.duration || 'Not specified'}
                      </p>

                      <p className="text-sm text-gray-600">
                        <strong>Pickup date:</strong>{' '}
                        {formatDate(request.pickupDate)}
                      </p>
                    </div>

                    {request.reason && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700">
                          Reason for request
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {request.reason}
                        </p>
                      </div>
                    )}

                    {request.urgencyReason && (
                      <div className="mt-3 rounded-lg bg-orange-50 p-4">
                        <p className="text-sm font-semibold text-orange-800">
                          Urgency explanation
                        </p>
                        <p className="mt-1 text-sm text-orange-700">
                          {request.urgencyReason}
                        </p>
                      </div>
                    )}

                    {/* Return Date */}
                    {request.status?.toUpperCase() === 'RETURNED' && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-800">
                          Return Date
                        </p>

                        <p className="mt-1 text-sm text-blue-700">
                          {formatDate(request.returnedAt, true)}
                        </p>
                      </div>
                    )}

                    {/* Status Message */}
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm text-gray-600">
                        {getRequestMessage(request.status)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="font-semibold text-green-700 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </section>
  )
}

export default MyRequests
