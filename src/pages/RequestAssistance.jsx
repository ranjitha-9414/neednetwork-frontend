
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  getResourceById,
  createResourceRequest,
} from '../api/resourceApi'

// Get today's date in local YYYY-MM-DD format
function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function RequestAssistance() {
  const [searchParams] = useSearchParams()
  const resourceId = searchParams.get('resourceId')

  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [savedRequest, setSavedRequest] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    reason: '',
    duration: '',
    pickupDate: '',
    urgencyLevel: 'NORMAL',
    urgencyReason: '',
  })

  const today = getTodayDate()

  // Fetch selected resource
  useEffect(() => {
    let cancelled = false

    async function fetchResource() {
      setResource(null)
      setError('')
      setLoading(true)

      if (!resourceId || !/^\d+$/.test(resourceId)) {
        setError('Invalid resource selection. Please select a resource again.')
        setLoading(false)
        return
      }

      try {
        const response = await getResourceById(resourceId)
        const fetchedResource = response.data

        // Verify selected resource ID
        if (
          !fetchedResource ||
          Number(fetchedResource.id) !== Number(resourceId)
        ) {
          throw new Error('Resource ID mismatch.')
        }

        if (!cancelled) {
          setResource(fetchedResource)
        }
      } catch (err) {
        console.error('Error fetching resource:', err)

        if (!cancelled) {
          setError('Could not load the selected resource. Please try again.')
          setResource(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchResource()

    return () => {
      cancelled = true
    }
  }, [resourceId])

  // Handle form input changes
  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  const needsUrgencyReason =
    form.urgencyLevel === 'EMERGENCY' ||
    form.urgencyLevel === 'URGENT'

  // Validate form before submission
  function validateForm() {
    if (!resource || !resourceId) {
      return 'Please select a valid resource.'
    }

    if (
      !/^\d+$/.test(resourceId) ||
      Number(resource.id) !== Number(resourceId)
    ) {
      return 'Resource ID mismatch. Please select the resource again.'
    }

    if (!resource.available) {
      return 'This resource is currently unavailable.'
    }

    if (!form.fullName.trim()) {
      return 'Please enter your full name.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Please enter a valid email address.'
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      return 'Please enter a valid 10-digit phone number.'
    }

    if (
      form.reason.trim().length < 10 ||
      form.reason.trim().length > 1000
    ) {
      return 'Your reason must contain between 10 and 1000 characters.'
    }

    if (!form.duration) {
      return 'Please select the required duration.'
    }

    if (!form.pickupDate) {
      return 'Please select a pickup date.'
    }

    if (form.pickupDate < today) {
      return 'Pickup date cannot be in the past.'
    }

    if (
      !['EMERGENCY', 'URGENT', 'NORMAL', 'PLANNED'].includes(
        form.urgencyLevel
      )
    ) {
      return 'Please select a valid urgency level.'
    }

    if (
      needsUrgencyReason &&
      (
        form.urgencyReason.trim().length < 10 ||
        form.urgencyReason.trim().length > 1000
      )
    ) {
      return 'Urgent requests require an explanation of 10 to 1000 characters.'
    }

    return ''
  }

  // Submit request
  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting) return

    setError('')

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSubmitting(true)

      const requestData = {
        resource: {
          id: Number(resourceId),
        },
        requesterName: form.fullName.trim(),
        requesterEmail: form.email.trim(),
        requesterPhone: form.phone.trim(),
        reason: form.reason.trim(),
        duration: form.duration,
        pickupDate: form.pickupDate,
        urgencyLevel: form.urgencyLevel,
        urgencyReason: form.urgencyReason.trim(),
      }

      console.log('Submitting resource request:', {
        resourceId: requestData.resource.id,
        resourceTitle: resource.title,
        urgencyLevel: requestData.urgencyLevel,
      })

      const response = await createResourceRequest(requestData)

      setSavedRequest(response.data)
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting request:', err)

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to submit your request. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Resource image
  const imageUrl =
    resource?.imageUrls?.[0] ||
    resource?.imageUrl ||
    resource?.image ||
    ''

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FBF9]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-[#145A46]" />

          <p className="mt-4 font-medium text-[#145A46]">
            Loading resource...
          </p>
        </div>
      </div>
    )
  }

  // Invalid resource screen
  if (!resource) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FBF9] px-6 py-20 text-center">

        <div className="text-5xl">📦</div>

        <h1 className="mt-5 text-2xl font-bold text-[#145A46]">
          Unable to load resource
        </h1>

        <p className="mt-3 text-gray-600">
          {error || 'Please select a valid resource first.'}
        </p>

        <Link
          to="/resources"
          className="mt-6 rounded-lg bg-[#145A46] px-6 py-3 font-semibold text-white"
        >
          Browse Resources
        </Link>

      </div>
    )
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#E8F5EF] px-4 py-16 sm:px-6">

        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-lg sm:p-10">

          <div className="text-5xl">🎉</div>

          <h1 className="mt-5 text-3xl font-bold text-[#145A46]">
            Request Submitted!
          </h1>

          <p className="mt-4 text-gray-600">
            Your request for {resource.title} has been successfully saved.
          </p>

          <div className="mt-6 rounded-xl bg-[#E8F5EF] p-5 text-left">

            <p className="font-semibold text-[#145A46]">
              Request ID: {savedRequest?.id ?? 'Saved'}
            </p>

            <p className="mt-3 text-sm text-gray-700">
              Resource: {resource.title}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              Resource ID: {resource.id}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              Urgency: {savedRequest?.urgencyLevel || form.urgencyLevel}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              Status:

              <span className="ml-1 font-semibold text-yellow-700">
                {savedRequest?.status || 'PENDING'}
              </span>
            </p>

          </div>

          <p className="mt-5 text-sm leading-6 text-gray-500">
            Your request is waiting for admin approval.
            Selecting an urgency level does not guarantee approval.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

            <Link
              to="/dashboard"
              className="rounded-lg border border-[#145A46] px-6 py-3 font-semibold text-[#145A46]"
            >
              View Dashboard
            </Link>

            <Link
              to="/resources"
              className="rounded-lg bg-[#145A46] px-6 py-3 font-semibold text-white"
            >
              Browse More Resources
            </Link>

          </div>

        </div>
      </div>
    )
  }

  // Resource unavailable screen
  if (!resource.available) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FBF9] px-6 py-20 text-center">

        <div className="text-5xl">📦</div>

        <h1 className="mt-5 text-2xl font-bold text-[#145A46]">
          This resource is currently unavailable.
        </h1>

        <p className="mt-3 text-gray-600">
          Please explore other available resources.
        </p>

        <Link
          to={`/resources/${resource.id}`}
          className="mt-6 font-semibold text-[#145A46] underline"
        >
          Back to Resource
        </Link>

      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FBF9] px-4 py-10 sm:px-6 sm:py-12">

      <div className="mx-auto max-w-3xl">

        {/* Page heading */}
        <div className="mb-8">

          <Link
            to={`/resources/${resource.id}`}
            className="text-sm font-semibold text-[#145A46] hover:underline"
          >
            ← Back to resource
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-[#145A46] sm:text-4xl">
            Request Assistance
          </h1>

          <p className="mt-3 text-gray-600">
            Complete the form below to request this resource.
          </p>

        </div>

        {/* Selected resource */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-[#E8F5EF] p-5 sm:flex-row sm:items-center">

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={resource.title}
              onError={event => {
                event.currentTarget.style.display = 'none'
              }}
              className="h-28 w-full rounded-xl bg-white object-contain sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gray-200 text-gray-500 sm:h-24 sm:w-24">
              No photo
            </div>
          )}

          <div className="min-w-0">

            <p className="text-sm font-medium text-green-700">
              Requesting resource
            </p>

            <h2 className="mt-1 break-words text-xl font-bold text-[#145A46]">
              {resource.title}
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {resource.location || 'Location not specified'}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Resource ID: {resource.id}
            </p>

            <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Available
            </span>

          </div>

        </div>

        {/* Request form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-8"
        >

          {/* Personal information */}
          <div>
            <h2 className="mb-5 border-b border-gray-100 pb-3 text-xl font-bold text-[#145A46]">
              Personal Information
            </h2>

            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="mb-2 block font-medium">
                Full Name *
              </label>

              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                maxLength={100}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
              />
            </div>

            {/* Email and phone */}
            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <div>
                <label htmlFor="email" className="mb-2 block font-medium">
                  Email Address *
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block font-medium">
                  Phone Number *
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Enter a 10-digit phone number"
                  placeholder="10-digit phone number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
                />
              </div>

            </div>
          </div>

          {/* Request reason */}
          <div>
            <h2 className="mb-5 border-b border-gray-100 pb-3 text-xl font-bold text-[#145A46]">
              Request Details
            </h2>

            <label htmlFor="reason" className="mb-2 block font-medium">
              Why do you need this resource? *
            </label>

            <textarea
              id="reason"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              placeholder="Explain how this resource will help you..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {form.reason.length}/1000 characters
            </p>
          </div>

          {/* Urgency selection */}
          <div className="rounded-xl border border-gray-200 p-4 sm:p-5">

            <label
              htmlFor="urgencyLevel"
              className="mb-2 block text-lg font-semibold text-[#145A46]"
            >
              How urgently do you need this resource? *
            </label>

            <p className="mb-4 text-sm text-gray-500">
              Select the option that best describes your situation.
              The admin will review your request.
            </p>

            <select
              id="urgencyLevel"
              name="urgencyLevel"
              value={form.urgencyLevel}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
            >
              <option value="EMERGENCY">
                Emergency - Immediate critical need
              </option>

              <option value="URGENT">
                Urgent - Need assistance soon
              </option>

              <option value="NORMAL">
                Normal - Regular requirement
              </option>

              <option value="PLANNED">
                Planned - Future requirement
              </option>
            </select>

            {needsUrgencyReason && (
              <div className="mt-5">

                <label
                  htmlFor="urgencyReason"
                  className="mb-2 block font-medium text-gray-800"
                >
                  Explain your urgent situation *
                </label>

                <textarea
                  id="urgencyReason"
                  name="urgencyReason"
                  value={form.urgencyReason}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  placeholder="Please explain why you need this resource urgently..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.urgencyReason.length}/1000 characters
                </p>

              </div>
            )}

            {form.urgencyLevel === 'EMERGENCY' && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                Emergency requests will be highlighted for admin attention.
                This is not an emergency response service.
              </div>
            )}

            {form.urgencyLevel === 'URGENT' && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Your request will be highlighted for priority review.
              </div>
            )}

          </div>

          {/* Duration and pickup date */}
          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label htmlFor="duration" className="mb-2 block font-medium">
                Required Duration *
              </label>

              <select
                id="duration"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
              >
                <option value="">Select duration</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="3 months">3 months</option>
                <option value="Long-term">Long-term</option>
              </select>
            </div>

            <div>
              <label htmlFor="pickupDate" className="mb-2 block font-medium">
                Preferred Pickup Date *
              </label>

              <input
                id="pickupDate"
                name="pickupDate"
                type="date"
                value={form.pickupDate}
                onChange={handleChange}
                required
                min={today}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#145A46] focus:outline-none"
              />
            </div>

          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#145A46] px-6 py-4 font-semibold text-white transition hover:bg-[#104735] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Submitting Request...'
              : 'Submit Assistance Request'}
          </button>

          <p className="text-center text-sm leading-6 text-gray-500">
            Your request will be saved with a Pending status.
            The admin will review its urgency before making a decision.
          </p>

        </form>

      </div>
    </div>
  )
}

export default RequestAssistance
