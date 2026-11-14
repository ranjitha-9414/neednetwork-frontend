
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRequestsByEmail } from '../api/resourceApi'

const filters = ['All', 'Currently Borrowed', 'Returned']

function formatDate(dateValue, includeTime = false) {
  if (!dateValue) return 'Not available'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

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

function BorrowingHistory() {
  const [borrowings, setBorrowings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')

  // Fetch borrowing history for the logged-in user
  const fetchBorrowingHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await getRequestsByEmail()

      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected response received from the server.')
      }

      // Include only approved and returned requests
      const history = response.data
        .filter(request =>
          ['APPROVED', 'RETURNED'].includes(
            request.status?.toUpperCase()
          )
        )
        .sort((a, b) => {
          return (
            new Date(b.approvedAt || b.createdAt || 0) -
            new Date(a.approvedAt || a.createdAt || 0)
          )
        })

      setBorrowings(history)
    } catch (err) {
      console.error('Error fetching borrowing history:', err)

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load borrowing history. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBorrowingHistory()
  }, [fetchBorrowingHistory])

  // Summary counts
  const currentlyBorrowed = borrowings.filter(
    item => item.status?.toUpperCase() === 'APPROVED'
  ).length

  const returnedCount = borrowings.filter(
    item => item.status?.toUpperCase() === 'RETURNED'
  ).length

  // Search and filter
  const filteredBorrowings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return borrowings.filter(item => {
      const status = item.status?.toUpperCase()

      const matchesFilter =
        selectedFilter === 'All' ||
        (selectedFilter === 'Currently Borrowed' &&
          status === 'APPROVED') ||
        (selectedFilter === 'Returned' &&
          status === 'RETURNED')

      const searchableText = [
        item.id,
        item.resource?.title,
        item.resource?.category,
        item.resource?.ownerName,
        item.resource?.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !term || searchableText.includes(term)

      return matchesFilter && matchesSearch
    })
  }, [borrowings, selectedFilter, searchTerm])

  function clearFilters() {
    setSearchTerm('')
    setSelectedFilter('All')
  }

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Borrowing History
            </h1>

            <p className="mt-2 text-gray-600">
              View resources you have borrowed and their return details.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchBorrowingHistory}
            disabled={loading}
            className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />

            <p className="text-gray-600">
              Loading borrowing history...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchBorrowingHistory}
              className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Borrowings
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {borrowings.length}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Currently Borrowed
                </p>

                <p className="mt-2 text-2xl font-bold text-yellow-600">
                  {currentlyBorrowed}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Returned
                </p>

                <p className="mt-2 text-2xl font-bold text-green-700">
                  {returnedCount}
                </p>
              </div>

            </div>

            {/* Search and Filters */}
            <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">

              <label
                htmlFor="borrowingSearch"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Search borrowing history
              </label>

              <input
                id="borrowingSearch"
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search resource, provider, category or ID..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">

                {filters.map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      selectedFilter === filter
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    {filter}
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
                Your Borrowings
              </h2>

              <p className="text-sm text-gray-500">
                Showing {filteredBorrowings.length} of {borrowings.length}
              </p>
            </div>

            {/* Empty History */}
            {borrowings.length === 0 && (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">

                <div className="mb-3 text-5xl">
                  📦
                </div>

                <h2 className="text-xl font-bold text-gray-800">
                  No borrowing history yet
                </h2>

                <p className="mt-2 text-gray-600">
                  Your approved and returned resource requests will appear here.
                </p>

                <Link
                  to="/resources"
                  className="mt-5 inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
                >
                  Explore Resources
                </Link>

              </div>
            )}

            {/* No Matching Results */}
            {borrowings.length > 0 &&
              filteredBorrowings.length === 0 && (
                <div className="rounded-xl bg-white p-10 text-center shadow-sm">

                  <h2 className="text-xl font-bold text-gray-800">
                    No matching borrowings
                  </h2>

                  <p className="mt-2 text-gray-600">
                    Try a different search term or filter.
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

            {/* Borrowing Cards */}
            {filteredBorrowings.length > 0 && (
              <div className="space-y-4">

                {filteredBorrowings.map(item => {
                  const isReturned =
                    item.status?.toUpperCase() === 'RETURNED'

                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                    >

                      {/* Resource Information */}
                      <div className="flex flex-wrap items-start justify-between gap-4">

                        <div>
                          <p className="mb-1 text-sm font-medium text-green-700">
                            {item.resource?.category || 'Uncategorized'}
                          </p>

                          <h3 className="text-xl font-bold text-gray-900">
                            {item.resource?.title || 'Resource'}
                          </h3>

                          <p className="mt-2 text-sm text-gray-500">
                            Borrowing ID: #{item.id}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            Provider: {item.resource?.ownerName || 'Not available'}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            📍 {item.resource?.location || 'Location not available'}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-medium ${
                            isReturned
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {isReturned
                            ? 'Returned'
                            : 'Currently Borrowed'}
                        </span>

                      </div>

                      {/* Borrowing Dates */}
                      <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Borrowed Date
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {item.approvedAt
                              ? formatDate(item.approvedAt, true)
                              : 'Approval date not recorded'}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Pickup Date
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {formatDate(item.pickupDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Borrowing Duration
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {item.duration || 'Not specified'}
                          </p>
                        </div>

                        {isReturned && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              Actual Return Date
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                              {formatDate(item.returnedAt, true)}
                            </p>
                          </div>
                        )}

                      </div>

                      {/* Request Reason */}
                      {item.reason && (
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-semibold text-gray-700">
                            Reason for borrowing
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {item.reason}
                          </p>
                        </div>
                      )}

                      {/* Status Message */}
                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm text-gray-600">
                          {isReturned
                            ? 'This resource has been returned successfully. Thank you for using NeedNetwork.'
                            : 'You currently have this resource borrowed. Please coordinate with the provider for its return.'}
                        </p>
                      </div>

                    </article>
                  )
                })}

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

export default BorrowingHistory
