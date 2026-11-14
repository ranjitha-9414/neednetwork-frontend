
import { useState, useEffect, useCallback } from 'react'
import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import axios from 'axios'
import { getMyResources } from '../api/resourceApi'

import API_BASE_URL from "../api/apiConfig";

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })

  const [hasResources, setHasResources] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // Mobile menu
  const [menuOpen, setMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false)
    setShowNotifications(false)
  }, [location.pathname, location.hash])

  // Homepage scrolling
  useEffect(() => {
    let frame1
    let frame2

    if (location.pathname === '/') {
      if (location.hash === '#how-it-works') {
        frame1 = requestAnimationFrame(() => {
          frame2 = requestAnimationFrame(() => {
            document.getElementById('how-it-works')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          })
        })
      } else if (!location.hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    return () => {
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
    }
  }, [location.pathname, location.hash])

  // Authentication configuration
  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
    },
  })

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!sessionStorage.getItem('token')) return

    try {
      const response = await axios.get(
        `${API_URL}/count`,
        getAuthConfig()
      )

      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Unable to fetch notification count:', error)
    }
  }, [])

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true)

    try {
      const response = await axios.get(API_URL, getAuthConfig())
      setNotifications(response.data)
    } catch (error) {
      console.error('Unable to fetch notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  // Toggle notifications
  async function toggleNotifications() {
    const nextState = !showNotifications
    setShowNotifications(nextState)

    if (nextState) {
      await fetchNotifications()
      await fetchUnreadCount()
    }
  }

  // Mark one notification as read
  async function markAsRead(id) {
    try {
      await axios.put(
        `${API_URL}/${id}/read`,
        {},
        getAuthConfig()
      )

      setNotifications(previous =>
        previous.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      )

      await fetchUnreadCount()
    } catch (error) {
      console.error('Unable to mark notification as read:', error)
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      await axios.put(
        `${API_URL}/read-all`,
        {},
        getAuthConfig()
      )

      setNotifications(previous =>
        previous.map(notification => ({
          ...notification,
          read: true,
        }))
      )

      setUnreadCount(0)
    } catch (error) {
      console.error('Unable to mark all notifications as read:', error)
    }
  }

  // Update user after login/logout
  useEffect(() => {
    function updateUser() {
      try {
        const storedUser = JSON.parse(
          sessionStorage.getItem('user') || 'null'
        )

        const token = sessionStorage.getItem('token')
        setUser(token ? storedUser : null)
      } catch {
        setUser(null)
      }
    }

    updateUser()

    window.addEventListener('authChange', updateUser)
    window.addEventListener('storage', updateUser)

    return () => {
      window.removeEventListener('authChange', updateUser)
      window.removeEventListener('storage', updateUser)
    }
  }, [])

  // Check owner status
  useEffect(() => {
    let cancelled = false

    async function checkOwnerStatus() {
      setHasResources(false)

      if (
        !user ||
        user.role?.toUpperCase() === 'ADMIN' ||
        !sessionStorage.getItem('token')
      ) {
        return
      }

      try {
        const response = await getMyResources()

        if (!cancelled) {
          const resources = Array.isArray(response.data)
            ? response.data
            : []

          setHasResources(resources.length > 0)
        }
      } catch (error) {
        console.error('Unable to check owner resources:', error)

        if (!cancelled) {
          setHasResources(false)
        }
      }
    }

    checkOwnerStatus()

    return () => {
      cancelled = true
    }
  }, [user])

  // Refresh notification count
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setShowNotifications(false)
      return
    }

    fetchUnreadCount()

    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [user, fetchUnreadCount])

  // Logout
  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')

    setHasResources(false)
    setNotifications([])
    setUnreadCount(0)
    setShowNotifications(false)
    setMenuOpen(false)

    window.dispatchEvent(new Event('authChange'))
    navigate('/login')
  }

  // Navigation links
  const navigationLinks = (
    <>
      <Link
        to="/"
        className="text-gray-700 transition hover:text-green-800"
      >
        Home
      </Link>

      <Link
        to="/resources"
        className="text-gray-700 transition hover:text-green-800"
      >
        Find Resources
      </Link>

      <Link
        to="/#how-it-works"
        className="text-gray-700 transition hover:text-green-800"
      >
        How It Works
      </Link>
    </>
  )

  // Notification button and dropdown
  const notificationSection = user && (
    <div className="relative">
      <button
        type="button"
        onClick={toggleNotifications}
        aria-label="Notifications"
        aria-expanded={showNotifications}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-xl hover:bg-green-50"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-12 z-[60] w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96">

          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-bold text-gray-800">
              Notifications
            </h3>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-green-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loadingNotifications ? (
              <p className="p-6 text-center text-sm text-gray-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mb-2 text-3xl">🔕</div>
                <p className="font-medium text-gray-700">
                  No notifications yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border-b p-4 transition hover:bg-gray-50 ${
                    !notification.read ? 'bg-green-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">
                      {notification.type === 'REQUEST'
                        ? '📩'
                        : notification.type === 'APPROVED'
                        ? '✅'
                        : notification.type === 'REJECTED'
                        ? '❌'
                        : '📦'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-800">
                          {notification.title}
                        </h4>

                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-600" />
                        )}
                      </div>

                      <p className="mt-1 break-words text-sm text-gray-600">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        {notification.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : ''}
                      </p>

                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2 text-xs font-semibold text-green-700 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t p-3 text-center">
            <button
              type="button"
              onClick={() => {
                fetchNotifications()
                fetchUnreadCount()
              }}
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              Refresh notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <nav className="relative z-50 bg-white shadow-sm">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="NeedNetwork Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-800 text-xl text-white">
            ♡
          </div>

          <span className="text-xl font-bold text-green-800 sm:text-2xl">
            NeedNetwork
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navigationLinks}
        </div>

        {/* Desktop authentication */}
        <div className="hidden items-center gap-3 md:flex">

          {user ? (
            <>
              <span className="font-medium text-green-800">
                Hi, {user.fullName?.split(' ')[0] || 'User'}
              </span>

              {notificationSection}

              <Link
                to="/dashboard"
                className="rounded-lg border border-green-800 px-4 py-2 font-medium text-green-800 hover:bg-green-50"
              >
                Dashboard
              </Link>

              {hasResources && (
                <Link
                  to="/owner-dashboard"
                  className="rounded-lg bg-green-800 px-4 py-2 font-medium text-white hover:bg-green-900"
                >
                  Owner Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-medium text-green-800"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-green-800 px-5 py-2.5 font-medium text-white hover:bg-green-900"
              >
                Get Started
              </Link>
            </>
          )}

        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">

          {notificationSection}

          <button
            type="button"
            onClick={() => setMenuOpen(previous => !previous)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-2xl text-green-800 hover:bg-green-50"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

        </div>

      </div>

      {/* Mobile navigation menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-5 py-5 shadow-lg md:hidden">

          <div className="flex flex-col gap-5">
            {navigationLinks}

            <div className="border-t border-gray-200 pt-4">

              {user ? (
                <div className="flex flex-col gap-4">

                  <p className="font-medium text-green-800">
                    Hi, {user.fullName?.split(' ')[0] || 'User'}
                  </p>

                  <Link
                    to="/dashboard"
                    className="font-medium text-gray-700 hover:text-green-800"
                  >
                    Dashboard
                  </Link>

                  {hasResources && (
                    <Link
                      to="/owner-dashboard"
                      className="font-medium text-gray-700 hover:text-green-800"
                    >
                      Owner Dashboard
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg bg-red-600 px-5 py-3 text-center font-medium text-white hover:bg-red-700"
                  >
                    Logout
                  </button>

                </div>
              ) : (
                <div className="flex flex-col gap-4">

                  <Link
                    to="/login"
                    className="font-medium text-green-800"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="rounded-lg bg-green-800 px-5 py-3 text-center font-medium text-white hover:bg-green-900"
                  >
                    Get Started
                  </Link>

                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </nav>
  )
}

export default Navbar
