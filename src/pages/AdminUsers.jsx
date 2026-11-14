
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminUsers,
  getAdminUserById,
  getAdminUserResources,
  updateAdminUserStatus,
  getAdminUserActivityHistory,
} from "../api/adminUserApi";

const roles = ["All", "USER", "VOLUNTEER", "NGO", "ADMIN"];
const accountFilters = ["All", "Active", "Inactive"];

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [selectedUser, setSelectedUser] = useState(null);
  const [userResources, setUserResources] = useState([]);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Account activity history
  const [activityHistory, setActivityHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  // Load registered users
  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminUsers();

      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error loading users:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load registered users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Load account activity history
  async function fetchActivityHistory(userId) {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await getAdminUserActivityHistory(userId);

      setActivityHistory(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Error loading activity history:", err);

      setActivityHistory([]);

      setHistoryError(
        err.response?.data?.message ||
        "Unable to load account activity history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  // Calculate statistics
  const totalUsers = users.length;

  const activeUsers = users.filter(
    user => user.active
  ).length;

  const inactiveUsers = users.filter(
    user => !user.active
  ).length;

  const verifiedUsers = users.filter(
    user => user.emailVerified
  ).length;

  // Search and filter users
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter(user => {
      const matchesSearch =
        !term ||
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        String(user.id).includes(term);

      const matchesRole =
        selectedRole === "All" ||
        user.role === selectedRole;

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Active" && user.active) ||
        (selectedStatus === "Inactive" && !user.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Open user details
  async function handleViewDetails(userId) {
    try {
      setSelectedUser(null);
      setUserResources([]);
      setActivityHistory([]);

      setDetailsError("");
      setHistoryError("");

      setDetailsLoading(true);

      const [userResponse, resourcesResponse] = await Promise.all([
        getAdminUserById(userId),
        getAdminUserResources(userId),
      ]);

      setSelectedUser(userResponse.data);

      setUserResources(
        Array.isArray(resourcesResponse.data)
          ? resourcesResponse.data
          : []
      );

      // Load activity history separately
      await fetchActivityHistory(userId);

    } catch (err) {
      console.error("Error loading user details:", err);

      setDetailsError(
        err.response?.data?.message ||
        "Unable to load user details. Please try again."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  // Activate or deactivate account
  async function handleAccountStatus(user) {
    if (user.role === "ADMIN") {
      return;
    }

    const nextStatus = !user.active;

    const action = nextStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.fullName}'s account?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(user.id);
      setError("");

      const response = await updateAdminUserStatus(
        user.id,
        nextStatus
      );

      const updatedUser = response.data;

      // Update user list
      setUsers(previousUsers =>
        previousUsers.map(existingUser =>
          existingUser.id === updatedUser.id
            ? updatedUser
            : existingUser
        )
      );

      // Update modal and refresh activity history
      if (selectedUser?.id === updatedUser.id) {
        setSelectedUser(updatedUser);

        await fetchActivityHistory(updatedUser.id);
      }

    } catch (err) {
      console.error("Error updating account:", err);

      setError(
        err.response?.data?.message ||
        "Unable to update account status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // Clear search and filters
  function clearFilters() {
    setSearchTerm("");
    setSelectedRole("All");
    setSelectedStatus("All");
  }

  // Close modal
  function closeDetails() {
    setSelectedUser(null);
    setUserResources([]);
    setActivityHistory([]);

    setDetailsError("");
    setHistoryError("");
  }

  return (
    <section className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 rounded-2xl bg-gray-900 p-8 text-white">
          <p className="mb-2 text-gray-300">
            NeedNetwork Administration
          </p>

          <h1 className="text-3xl font-bold">
            User Management
          </h1>

          <p className="mt-3 text-gray-300">
            View registered users, manage accounts and
            monitor community contributions.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="rounded-lg bg-white px-5 py-2 font-semibold text-gray-900 hover:bg-gray-200"
            >
              ← Admin Dashboard
            </Link>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="rounded-lg border border-white px-5 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh Users"}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalUsers}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Active Accounts
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {activeUsers}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Inactive Accounts
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {inactiveUsers}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Verified Emails
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {verifiedUsers}
            </p>
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* User Management */}
        <div className="rounded-xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Registered Users
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search and manage NeedNetwork accounts.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
              {filteredUsers.length} of {totalUsers} users
            </span>
          </div>

          {/* Search */}
          <div className="mb-5">
            <label
              htmlFor="userSearch"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Search users
            </label>

            <input
              id="userSearch"
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search by name, email or user ID..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Filters */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">

            <div>
              <label
                htmlFor="roleFilter"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Filter by role
              </label>

              <select
                id="roleFilter"
                value={selectedRole}
                onChange={event => setSelectedRole(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role === "All" ? "All Roles" : role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="statusFilter"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Filter by account status
              </label>

              <select
                id="statusFilter"
                value={selectedStatus}
                onChange={event => setSelectedStatus(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              >
                {accountFilters.map(status => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Accounts" : status}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="mb-6 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Clear filters
            </button>
          </div>

          {/* User List */}
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Loading registered users...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl">👥</p>

              <h3 className="mt-3 text-lg font-semibold text-gray-700">
                No registered users
              </h3>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold text-gray-700">
                No matching users
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {filteredUsers.map(user => (
                <article
                  key={user.id}
                  className="rounded-xl border border-gray-200 p-5 transition hover:shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

                    {/* User Information */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {user.fullName}
                        </h3>

                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                          {user.role}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-2 break-all text-sm text-gray-600">
                        {user.email}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                        <span>User ID: #{user.id}</span>

                        <span>
                          Phone: {user.phone || "Not available"}
                        </span>

                        <span>
                          Joined: {formatDate(user.createdAt)}
                        </span>

                        <span>
                          Email: {user.emailVerified ? "Verified" : "Not verified"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">

                      <button
                        onClick={() => handleViewDetails(user.id)}
                        className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => handleAccountStatus(user)}
                        disabled={
                          updatingId === user.id ||
                          user.role === "ADMIN"
                        }
                        title={
                          user.role === "ADMIN"
                            ? "Administrator accounts cannot be managed here"
                            : ""
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                          user.active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-700 hover:bg-green-800"
                        }`}
                      >
                        {updatingId === user.id
                          ? "Updating..."
                          : user.active
                            ? "Deactivate"
                            : "Activate"}
                      </button>

                    </div>
                  </div>
                </article>
              ))}

            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {(selectedUser || detailsLoading || detailsError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-green-700">
                  NeedNetwork User Profile
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  User Details
                </h2>
              </div>

              <button
                onClick={closeDetails}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close user details"
              >
                ✕
              </button>

            </div>

            {/* Loading */}
            {detailsLoading ? (
              <div className="py-12 text-center text-gray-500">
                Loading user details and resources...
              </div>
            ) : detailsError ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {detailsError}
              </div>
            ) : selectedUser && (
              <>

                {/* User Profile */}
                <div className="rounded-xl bg-gray-50 p-5">

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedUser.fullName}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedUser.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedUser.active
                        ? "Active Account"
                        : "Inactive Account"}
                    </span>

                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">

                    <div>
                      <p className="text-xs text-gray-500">
                        User ID
                      </p>
                      <p className="mt-1 font-medium">
                        #{selectedUser.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Role
                      </p>
                      <p className="mt-1 font-medium">
                        {selectedUser.role}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Email
                      </p>
                      <p className="mt-1 break-all font-medium">
                        {selectedUser.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Phone
                      </p>
                      <p className="mt-1 font-medium">
                        {selectedUser.phone || "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Email Verification
                      </p>
                      <p className="mt-1 font-medium">
                        {selectedUser.emailVerified
                          ? "Verified"
                          : "Not verified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Registration Date
                      </p>
                      <p className="mt-1 font-medium">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>

                  </div>

                  {selectedUser.role !== "ADMIN" && (
                    <button
                      onClick={() => handleAccountStatus(selectedUser)}
                      disabled={updatingId === selectedUser.id}
                      className={`mt-5 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                        selectedUser.active
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-700 hover:bg-green-800"
                      }`}
                    >
                      {updatingId === selectedUser.id
                        ? "Updating..."
                        : selectedUser.active
                          ? "Deactivate Account"
                          : "Activate Account"}
                    </button>
                  )}

                </div>

                {/* Account Activity History */}
                <div className="mt-6">

                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Account Activity History
                      </h3>

                      <p className="text-sm text-gray-500">
                        Records of account activation and deactivation.
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                      {activityHistory.length} Activities
                    </span>

                  </div>

                  {historyLoading ? (
                    <div className="rounded-xl bg-gray-50 py-6 text-center text-gray-500">
                      Loading activity history...
                    </div>
                  ) : historyError ? (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">

                      <p>{historyError}</p>

                      <button
                        onClick={() =>
                          fetchActivityHistory(selectedUser.id)
                        }
                        className="mt-2 font-semibold underline"
                      >
                        Try Again
                      </button>

                    </div>
                  ) : activityHistory.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 py-6 text-center">

                      <p className="text-3xl">📋</p>

                      <p className="mt-2 font-semibold text-gray-700">
                        No account activity yet
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Account status changes will appear here.
                      </p>

                    </div>
                  ) : (
                    <div className="space-y-3">

                      {activityHistory.map(activity => (
                        <article
                          key={activity.id}
                          className="rounded-xl border border-gray-200 p-4"
                        >

                          <div className="flex flex-wrap items-center justify-between gap-3">

                            <div className="flex items-center gap-3">

                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                                  activity.action === "ACTIVATED"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {activity.action === "ACTIVATED"
                                  ? "✓"
                                  : "⊘"}
                              </span>

                              <div>
                                <p className="font-semibold text-gray-900">
                                  Account {activity.action?.toLowerCase()}
                                </p>

                                <p className="text-xs text-gray-500">
                                  Activity ID: #{activity.id}
                                </p>
                              </div>

                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                activity.action === "ACTIVATED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {activity.action}
                            </span>

                          </div>

                          <div className="mt-4 grid gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2">

                            <div>
                              <p className="text-xs text-gray-500">
                                Previous Status
                              </p>

                              <p className="mt-1 font-medium">
                                {activity.previousStatus
                                  ? "Active"
                                  : "Inactive"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">
                                New Status
                              </p>

                              <p className="mt-1 font-medium">
                                {activity.newStatus
                                  ? "Active"
                                  : "Inactive"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">
                                Changed By
                              </p>

                              <p className="mt-1 break-all font-medium">
                                {activity.adminEmail || "Not available"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">
                                Date and Time
                              </p>

                              <p className="mt-1 font-medium">
                                {formatDateTime(activity.createdAt)}
                              </p>
                            </div>

                          </div>

                        </article>
                      ))}

                    </div>
                  )}

                </div>

                {/* User Resources */}
                <div className="mt-6">

                  <div className="mb-4 flex items-center justify-between gap-3">

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Resources Posted
                      </h3>

                      <p className="text-sm text-gray-500">
                        Resources contributed by this user.
                      </p>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                      {userResources.length} Resources
                    </span>

                  </div>

                  {userResources.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center">

                      <p className="text-3xl">📦</p>

                      <p className="mt-2 font-semibold text-gray-700">
                        No resources posted
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        This user has not offered any resources yet.
                      </p>

                    </div>
                  ) : (
                    <div className="space-y-3">

                      {userResources.map(resource => (
                        <article
                          key={resource.id}
                          className="rounded-xl border border-gray-200 p-4"
                        >

                          <div className="flex flex-wrap items-start justify-between gap-3">

                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {resource.title || "Untitled Resource"}
                              </h4>

                              <p className="mt-1 text-sm text-gray-500">
                                {resource.category || "Uncategorized"}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                resource.available
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {resource.available
                                ? "Available"
                                : "Unavailable"}
                            </span>

                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">

                            <span>
                              Resource ID: #{resource.id}
                            </span>

                            <span>
                              Location: {resource.location || "Not available"}
                            </span>

                            <span>
                              Posted: {formatDate(resource.createdAt)}
                            </span>

                          </div>

                        </article>
                      ))}

                    </div>
                  )}

                </div>

              </>
            )}

          </div>
        </div>
      )}

    </section>
  );
}

export default AdminUsers;
