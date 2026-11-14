
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getRequestsByEmail,
  getMyResources,
} from '../api/resourceApi'

function Dashboard() {
  const [user] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })

  const [requests, setRequests] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch dashboard information
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!user?.email || !sessionStorage.getItem('token')) {
      setError('Please log in to view your dashboard.')
      setLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      // Both endpoints use the logged-in user's JWT
      const [requestsResponse, resourcesResponse] = await Promise.all([
        getRequestsByEmail(),
        getMyResources(),
      ])

      setRequests(
        Array.isArray(requestsResponse.data)
          ? requestsResponse.data
          : []
      )

      setResources(
        Array.isArray(resourcesResponse.data)
          ? resourcesResponse.data
          : []
      )

      setLastUpdated(new Date())

    } catch (err) {
      console.error('Dashboard loading error:', err)

      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.')
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this dashboard.')
      } else {
        setError('Unable to load dashboard data. Please try again.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  // Initial dashboard loading
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Calculate statistics
  const pendingRequests = requests.filter(
    request => request.status?.toUpperCase() === 'PENDING'
  ).length

  const approvedRequests = requests.filter(
    request => request.status?.toUpperCase() === 'APPROVED'
  ).length

  const completedRequests = requests.filter(
    request =>
      ['RETURNED', 'COMPLETED'].includes(
        request.status?.toUpperCase()
      )
  ).length

  const dashboardStats = [
    {
      title: 'My Requests',
      value: requests.length,
      icon: '📩',
      color: 'bg-blue-100 text-blue-800',
      link: '/my-requests',
    },
    {
      title: 'Resources Offered',
      value: resources.length,
      icon: '🎁',
      color: 'bg-green-100 text-green-800',
      link: '/my-resources',
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: '⏳',
      color: 'bg-yellow-100 text-yellow-800',
      link: '/my-requests',
    },
    {
      title: 'Approved Requests',
      value: approvedRequests,
      icon: '👍',
      color: 'bg-indigo-100 text-indigo-800',
      link: '/my-requests',
    },
    {
      title: 'Completed',
      value: completedRequests,
      icon: '✅',
      color: 'bg-amber-100 text-amber-800',
      link: '/my-requests',
    },
  ]

  // Recent requests
  const recentRequests = [...requests]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()

      return dateB - dateA
    })
    .slice(0, 5)

  // Format date
  function formatDate(date) {
    if (!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable'
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Status styles
  function getStatusStyle(status) {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'

      case 'RETURNED':
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'

      case 'REJECTED':
        return 'bg-red-100 text-red-800'

      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Display readable status
  function displayStatus(status) {
    if (status?.toUpperCase() === 'RETURNED') {
      return 'Completed'
    }

    if (!status) return 'Unknown'

    return status.charAt(0) + status.slice(1).toLowerCase()
  }

  // Urgency styles
  function getUrgencyStyle(level) {
    switch (level?.toUpperCase()) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800'

      case 'URGENT':
        return 'bg-orange-100 text-orange-800'

      case 'PLANNED':
        return 'bg-blue-100 text-blue-800'

      case 'NORMAL':
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

          <p className="mt-4 font-semibold text-green-700">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Login required
  if (!user?.email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">

        <div className="text-5xl">🔐</div>

        <h1 className="mt-5 text-2xl font-bold text-green-800">
          Login Required
        </h1>

        <p className="mt-3 text-gray-600">
          Please log in to access your NeedNetwork dashboard.
        </p>

        <Link
          to="/login"
          className="mt-6 rounded-lg bg-green-800 px-6 py-3 font-semibold text-white"
        >
          Login
        </Link>

      </div>
    )
  }

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">

      <div className="mx-auto max-w-7xl">

        {/* Welcome section */}
        <div className="mb-8 flex flex-col justify-between gap-5 rounded-2xl bg-green-800 p-6 text-white sm:p-8 md:flex-row md:items-center">

          <div>
            <p className="mb-2 text-green-100">
              Your NeedNetwork Dashboard
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Welcome back, {user.fullName || 'User'}! 👋
            </h1>

            <p className="mt-3 max-w-xl text-green-100">
              Manage your assistance requests, resources, and community activity
              from one place.
            </p>

            <p className="mt-3 text-sm text-green-200">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="rounded-lg bg-white px-5 py-3 font-semibold text-green-800 transition hover:bg-green-50 disabled:opacity-60"
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh Dashboard'}
          </button>

        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="font-semibold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {dashboardStats.map(stat => (
            <Link
              key={stat.title}
              to={stat.link}
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>

                <div className={`rounded-xl p-4 text-2xl ${stat.color}`}>
                  {stat.icon}
                </div>

              </div>

              <p className="mt-4 text-sm font-medium text-green-700">
                View details →
              </p>

            </Link>
          ))}

        </div>

        {/* Quick Actions */}
        <div className="mb-10">

          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-3">

            <Link
              to="/resources"
              className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Find Resources
            </Link>

            <Link
              to="/offer-resource"
              className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
            >
              Offer a Resource
            </Link>

            <Link
              to="/my-requests"
              className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
            >
              View My Requests
            </Link>

            <Link
              to="/my-resources"
              className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
            >
              Manage My Resources
            </Link>

            <Link
              to="/borrowing-history"
              className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
            >
              Borrowing History
            </Link>

          </div>
        </div>

        {/* Recent Requests */}
        <div className="mb-10 rounded-xl bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <h2 className="text-xl font-bold text-gray-900">
              Recent Assistance Requests
            </h2>

            <Link
              to="/my-requests"
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              View All Requests →
            </Link>

          </div>

          {recentRequests.length === 0 ? (

            <div className="py-10 text-center">

              <div className="text-4xl">📩</div>

              <p className="mt-3 font-medium text-gray-700">
                No assistance requests yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Browse the marketplace and request a resource when you need one.
              </p>

              <Link
                to="/resources"
                className="mt-5 inline-block rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Find Resources
              </Link>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[650px] text-left">

                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="pb-3">Resource</th>
                    <th className="pb-3">Request Date</th>
                    <th className="pb-3">Urgency</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>

                <tbody>

                  {recentRequests.map(request => (
                    <tr
                      key={request.id}
                      className="border-b last:border-0"
                    >

                      <td className="py-4 font-medium text-gray-800">
                        {request.resource?.title || 'Unknown Resource'}
                        <p className="mt-1 text-xs text-gray-400">
                          Request #{request.id}
                        </p>
                      </td>

                      <td className="py-4 text-gray-600">
                        {formatDate(request.createdAt)}
                      </td>

                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getUrgencyStyle(request.urgencyLevel)}`}>
                          {request.urgencyLevel || 'NORMAL'}
                        </span>
                      </td>

                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusStyle(request.status)}`}>
                          {displayStatus(request.status)}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* Offered Resources */}
        <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <h2 className="text-xl font-bold text-gray-900">
              My Offered Resources
            </h2>

            <Link
              to="/my-resources"
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              View All Resources →
            </Link>

          </div>

          {resources.length === 0 ? (

            <div className="py-10 text-center">

              <div className="text-4xl">🎁</div>

              <p className="mt-3 font-medium text-gray-700">
                You haven't offered any resources yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Share something useful with someone in your community.
              </p>

              <Link
                to="/offer-resource"
                className="mt-5 inline-block rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Offer a Resource
              </Link>

            </div>

          ) : (

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {resources.slice(0, 6).map(resource => (
                <div
                  key={resource.id}
                  className="rounded-xl border border-gray-200 p-5 transition hover:shadow-sm"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {resource.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {resource.category || 'Other'}
                      </p>
                    </div>

                    <span className="text-xl">🎁</span>

                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    {resource.location || 'Location not specified'}
                  </p>

                  <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                      resource.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {resource.available ? 'Available' : 'Unavailable'}
                  </span>

                  <div className="mt-4 border-t border-gray-100 pt-3">

                    <Link
                      to={`/resources/${resource.id}`}
                      className="text-sm font-semibold text-green-700 hover:underline"
                    >
                      View Resource →
                    </Link>

                  </div>

                </div>
              ))}

            </div>

          )}

          <Link
            to="/offer-resource"
            className="mt-6 inline-block font-semibold text-green-700 hover:underline"
          >
            + Add another resource
          </Link>

        </div>

        {/* Last updated */}
        {lastUpdated && (
          <p className="mt-5 text-right text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

      </div>
    </section>
  )
}

export default Dashboard
