import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getAllRequests,
  approveRequest,
  rejectRequest,
  returnResource,
} from '../api/resourceApi'

const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Returned']

const urgencyOrder = {
  EMERGENCY: 1,
  URGENT: 2,
  NORMAL: 3,
  PLANNED: 4,
}

function getUrgency(request) {
  return request.urgencyLevel?.toUpperCase() || 'NORMAL'
}

function getUrgencyStyle(urgency) {
  switch (urgency) {
    case 'EMERGENCY':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'URGENT':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'NORMAL':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'PLANNED':
      return 'bg-gray-100 text-gray-700 border-gray-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

function formatDate(date) {
  if (!date) return 'Not available'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not available'
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(date) {
  if (!date) return 'Return date not recorded'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Return date not recorded'
  }

  return parsedDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusStyle(status) {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'RETURNED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

function AdminDashboard() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [updatingAction, setUpdatingAction] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Fetch all requests
  async function fetchRequests(showLoader = true) {
    try {
      if (showLoader) setLoading(true)

      setError('')

      const response = await getAllRequests()

      setRequests(
        Array.isArray(response.data) ? response.data : []
      )
    } catch (err) {
      console.error('Error fetching requests:', err)

      setError(
        err.response?.data?.message ||
        'Unable to load requests. Please check your backend.'
      )
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Calculate statistics
  const totalRequests = requests.length

  const pendingRequests = requests.filter(
    request => request.status?.toUpperCase() === 'PENDING'
  ).length

  const approvedRequests = requests.filter(
    request => request.status?.toUpperCase() === 'APPROVED'
  ).length

  const rejectedRequests = requests.filter(
    request => request.status?.toUpperCase() === 'REJECTED'
  ).length

  const returnedRequests = requests.filter(
    request => request.status?.toUpperCase() === 'RETURNED'
  ).length

  // Urgency statistics
  const emergencyRequests = requests.filter(
    request =>
      request.status?.toUpperCase() === 'PENDING' &&
      getUrgency(request) === 'EMERGENCY'
  ).length

  const urgentRequests = requests.filter(
    request =>
      request.status?.toUpperCase() === 'PENDING' &&
      getUrgency(request) === 'URGENT'
  ).length

  const stats = [
    {
      title: 'Total Requests',
      value: totalRequests,
      icon: '📋',
      status: 'All',
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: '📩',
      status: 'Pending',
    },
    {
      title: 'Approved Requests',
      value: approvedRequests,
      icon: '✅',
      status: 'Approved',
    },
    {
      title: 'Rejected Requests',
      value: rejectedRequests,
      icon: '❌',
      status: 'Rejected',
    },
    {
      title: 'Returned Resources',
      value: returnedRequests,
      icon: '↩️',
      status: 'Returned',
    },
  ]

  // Sort requests:
  // 1. Pending requests first
  // 2. Emergency before Urgent, Normal and Planned
  // 3. Older requests first when priority is equal
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const statusA =
        a.status?.toUpperCase() === 'PENDING' ? 0 : 1

      const statusB =
        b.status?.toUpperCase() === 'PENDING' ? 0 : 1

      if (statusA !== statusB) {
        return statusA - statusB
      }

      const priorityA =
        urgencyOrder[getUrgency(a)] || 5

      const priorityB =
        urgencyOrder[getUrgency(b)] || 5

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()

      return dateA - dateB
    })
  }, [requests])

  // Search and filter requests
  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return sortedRequests.filter(request => {
      const matchesStatus =
        selectedStatus === 'All' ||
        request.status?.toUpperCase() === selectedStatus.toUpperCase()

      const matchesSearch =
        !term ||
        request.requesterName?.toLowerCase().includes(term) ||
        request.requesterEmail?.toLowerCase().includes(term) ||
        request.resource?.title?.toLowerCase().includes(term) ||
        request.resource?.category?.toLowerCase().includes(term) ||
        request.urgencyLevel?.toLowerCase().includes(term) ||
        request.urgencyReason?.toLowerCase().includes(term) ||
        String(request.id).includes(term)

      return matchesStatus && matchesSearch
    })
  }, [sortedRequests, selectedStatus, searchTerm])

  // Approve or reject request
  async function updateStatus(id, newStatus) {
    const actionName =
      newStatus === 'APPROVED' ? 'approve' : 'reject'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionName} this request?`
    )

    if (!confirmed) return

    try {
      setUpdatingId(id)
      setUpdatingAction(newStatus)
      setError('')

      if (newStatus === 'APPROVED') {
        await approveRequest(id)
      } else {
        await rejectRequest(id)
      }

      await fetchRequests(false)
    } catch (err) {
      console.error('Error updating request:', err)

      setError(
        err.response?.data?.message ||
        'Unable to update request status.'
      )
    } finally {
      setUpdatingId(null)
      setUpdatingAction('')
    }
  }

  // Mark resource as returned
  async function handleReturnResource(id) {
    const confirmed = window.confirm(
      'Are you sure this resource has been returned?'
    )

    if (!confirmed) return

    try {
      setUpdatingId(id)
      setUpdatingAction('RETURNED')
      setError('')

      await returnResource(id)
      await fetchRequests(false)
    } catch (err) {
      console.error('Error returning resource:', err)

      setError(
        err.response?.data?.message ||
        'Unable to return this resource.'
      )
    } finally {
      setUpdatingId(null)
      setUpdatingAction('')
    }
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedStatus('All')
  }

  return (
    <section className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 rounded-2xl bg-gray-900 p-8 text-white">

          <p className="mb-2 text-gray-300">
            NeedNetwork Administration
          </p>

          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-gray-300">
            Manage community resources and assistance requests.
          </p>

          {/* Admin Navigation */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/admin/users"
              className="rounded-lg bg-white px-5 py-2 font-semibold text-gray-900 hover:bg-gray-200"
            >
              User Management
            </Link>

            <Link
              to="/admin/activity-log"
              className="rounded-lg border border-white px-5 py-2 font-semibold text-white hover:bg-gray-800"
            >
              Activity Log
            </Link>

            <button
              onClick={() => fetchRequests()}
              disabled={loading || updatingId !== null}
              className="rounded-lg border border-white px-5 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '↻ Refresh Requests'}
            </button>
          </div>
        </div>

        {/* Urgency Summary */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2">

          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Pending Emergency Requests
                </p>

                <p className="mt-2 text-3xl font-bold text-red-800">
                  {emergencyRequests}
                </p>
              </div>

              <span className="text-3xl">🚨</span>
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-orange-700">
                  Pending Urgent Requests
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-800">
                  {urgentRequests}
                </p>
              </div>

              <span className="text-3xl">⚡</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">

          {stats.map(stat => (
            <button
              key={stat.title}
              type="button"
              onClick={() => setSelectedStatus(stat.status)}
              className={`rounded-xl bg-white p-6 text-left shadow-sm transition hover:shadow-md ${
                selectedStatus === stat.status
                  ? 'ring-2 ring-green-600'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {stat.value}
                  </p>
                </div>

                <span className="text-3xl">
                  {stat.icon}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Request Management */}
        <div className="rounded-xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-xl font-bold">
                Assistance Request Management
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review and manage community assistance requests.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
              {totalRequests} Total
            </span>
          </div>

          {/* Priority explanation */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">

            <p className="font-semibold text-blue-900">
              📌 Request review priority
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="font-medium text-red-700">
                1. Emergency
              </span>

              <span className="font-medium text-orange-700">
                2. Urgent
              </span>

              <span className="font-medium text-blue-700">
                3. Normal
              </span>

              <span className="font-medium text-gray-700">
                4. Planned
              </span>
            </div>

            <p className="mt-3 text-xs text-blue-800">
              Priority helps organize requests. Admin must review the
              situation and make the final approval decision.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="mb-5">

            <label
              htmlFor="requestSearch"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Search requests
            </label>

            <input
              id="requestSearch"
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search requester, email, resource, urgency or request ID..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Status Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-2">

            {statuses.map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedStatus === status
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                }`}
              >
                {status}
              </button>
            ))}

            <button
              onClick={clearFilters}
              className="ml-auto text-sm font-semibold text-red-600 hover:underline"
            >
              Clear filters
            </button>
          </div>

          {/* Loading and Requests */}
          {loading ? (

            <div className="py-12 text-center text-gray-500">
              Loading assistance requests...
            </div>

          ) : requests.length === 0 ? (

            <div className="py-12 text-center">
              <p className="text-4xl">📭</p>

              <h3 className="mt-3 text-lg font-semibold text-gray-700">
                No requests found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                New assistance requests will appear here.
              </p>
            </div>

          ) : filteredRequests.length === 0 ? (

            <div className="py-12 text-center">

              <h3 className="text-lg font-semibold text-gray-700">
                No matching requests
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or status filter.
              </p>

              <button
                onClick={clearFilters}
                className="mt-4 font-semibold text-green-700 hover:underline"
              >
                Clear filters
              </button>
            </div>

          ) : (

            <div className="space-y-5">

              <p className="text-sm text-gray-500">
                Showing {filteredRequests.length} of {totalRequests} requests
              </p>

              {filteredRequests.map(request => {

                const urgency = getUrgency(request)

                return (
                  <article
                    key={request.id}
                    className={`rounded-xl border p-5 ${
                      urgency === 'EMERGENCY' &&
                      request.status?.toUpperCase() === 'PENDING'
                        ? 'border-red-300 bg-red-50/40'
                        : urgency === 'URGENT' &&
                          request.status?.toUpperCase() === 'PENDING'
                          ? 'border-orange-300 bg-orange-50/40'
                          : 'border-gray-200'
                    }`}
                  >

                    {/* Request Information */}
                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div className="flex-1">

                        <p className="text-sm font-medium text-green-700">
                          {request.resource?.category}
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-gray-900">
                          {request.resource?.title || 'Resource'}
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          Request ID: #{request.id}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Request date: {formatDate(request.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">

                        {/* Urgency badge */}
                        <span
                          className={`rounded-full border px-4 py-2 text-sm font-bold ${getUrgencyStyle(urgency)}`}
                        >
                          {urgency === 'EMERGENCY' && '🚨 '}
                          {urgency === 'URGENT' && '⚡ '}
                          {urgency}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>

                    {/* Requester Details */}
                    <div className="mt-5 grid gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">

                      <div>
                        <p className="text-xs text-gray-500">
                          Requester
                        </p>

                        <p className="mt-1 font-medium">
                          {request.requesterName || 'Not available'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Email
                        </p>

                        <p className="mt-1 break-all font-medium">
                          {request.requesterEmail || 'Not available'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Phone
                        </p>

                        <p className="mt-1 font-medium">
                          {request.requesterPhone || 'Not provided'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Location
                        </p>

                        <p className="mt-1 font-medium">
                          {request.resource?.location || 'Not available'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Required Duration
                        </p>

                        <p className="mt-1 font-medium">
                          {request.duration || 'Not specified'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Pickup Date
                        </p>

                        <p className="mt-1 font-medium">
                          {formatDate(request.pickupDate)}
                        </p>
                      </div>

                    </div>

                    {/* General Reason */}
                    <div className="mt-4">

                      <p className="text-sm font-semibold text-gray-700">
                        Reason for requesting
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                        {request.reason || 'No reason provided'}
                      </p>
                    </div>

                    {/* NEW: Urgency Explanation */}
                    {(urgency === 'EMERGENCY' || urgency === 'URGENT') && (
                      <div className={`mt-4 rounded-lg border p-4 ${
                        urgency === 'EMERGENCY'
                          ? 'border-red-200 bg-red-50'
                          : 'border-orange-200 bg-orange-50'
                      }`}>

                        <p className={`text-sm font-bold ${
                          urgency === 'EMERGENCY'
                            ? 'text-red-800'
                            : 'text-orange-800'
                        }`}>
                          {urgency === 'EMERGENCY'
                            ? '🚨 Emergency Explanation'
                            : '⚡ Urgent Request Explanation'}
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                          {request.urgencyReason ||
                            'No urgency explanation provided'}
                        </p>
                      </div>
                    )}

                    {/* Return Date */}
                    {request.status?.toUpperCase() === 'RETURNED' && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-4">

                        <p className="text-sm font-semibold text-blue-800">
                          Returned On
                        </p>

                        <p className="mt-1 text-sm text-blue-700">
                          {formatDateTime(request.returnedAt)}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">

                      <p className="text-sm text-gray-500">
                        Resource ID: {request.resource?.id ?? 'Not available'}
                      </p>

                      {request.status?.toUpperCase() === 'PENDING' ? (

                        <div className="flex flex-wrap gap-3">

                          <button
                            onClick={() => updateStatus(request.id, 'APPROVED')}
                            disabled={updatingId !== null}
                            className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                          >
                            {updatingId === request.id &&
                            updatingAction === 'APPROVED'
                              ? 'Approving...'
                              : '✓ Approve'}
                          </button>

                          <button
                            onClick={() => updateStatus(request.id, 'REJECTED')}
                            disabled={updatingId !== null}
                            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {updatingId === request.id &&
                            updatingAction === 'REJECTED'
                              ? 'Rejecting...'
                              : '✕ Reject'}
                          </button>

                        </div>

                      ) : request.status?.toUpperCase() === 'APPROVED' ? (

                        <button
                          onClick={() => handleReturnResource(request.id)}
                          disabled={updatingId !== null}
                          className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                          {updatingId === request.id &&
                          updatingAction === 'RETURNED'
                            ? 'Processing...'
                            : '↩ Mark as Returned'}
                        </button>

                      ) : (

                        <span className="text-sm font-medium text-gray-500">
                          {request.status?.toUpperCase() === 'RETURNED'
                            ? '✓ Resource returned successfully'
                            : 'No further action available'}
                        </span>
                      )}

                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard