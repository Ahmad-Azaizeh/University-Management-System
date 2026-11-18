
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'
const PAGE_SIZE = 10
const SCHOOL_PAGE_SIZE = 100

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null)

  return result?.message || result?.title || result?.detail || fallback
}

async function fetchAllPages(endpoint, token, signal) {
  let pageNumber = 1
  let totalPages = 1
  const allItems = []

  while (pageNumber <= totalPages) {
    const query = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(SCHOOL_PAGE_SIZE),
    })

    const response = await fetch(`${API}/${endpoint}?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    })

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'Failed to load schools.')
      )
    }

    const data = await response.json()

    allItems.push(...(data.items ?? []))

    totalPages = data.totalPages ??
      Math.ceil((data.totalCount ?? 0) / SCHOOL_PAGE_SIZE)

    pageNumber++
  }

  return allItems
}

function DirectorsPage() {
  const { user } = useAuth()
  const token = user?.token

  const [directors, setDirectors] = useState([])
  const [schools, setSchools] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [editingDirector, setEditingDirector] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [formData, setFormData] = useState({
    fullName: '',
    loginId: '',
    password: '',
  })

  // Load all schools for the assigned-school column
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadSchools() {
      try {
        const data = await fetchAllPages(
          'Schools',
          token,
          controller.signal
        )

        setSchools(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Failed to load schools.')
        }
      }
    }

    loadSchools()

    return () => controller.abort()
  }, [token])

  // Load paginated Directors
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadDirectors() {
      setLoading(true)

      try {
        const query = new URLSearchParams({
          pageNumber: String(pageNumber),
          pageSize: String(PAGE_SIZE),
        })

        if (activeSearch) {
          query.set('searchTerm', activeSearch)
        }

        const response = await fetch(
          `${API}/Users/directors?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(response, 'Failed to load Directors.')
          )
        }

        const data = await response.json()

        const pages = data.totalPages ??
          Math.ceil((data.totalCount ?? 0) / PAGE_SIZE)

        setDirectors(data.items ?? [])
        setTotalCount(data.totalCount ?? 0)
        setTotalPages(pages)

        const lastPage = Math.max(pages, 1)

        if (pageNumber > lastPage) {
          setPageNumber(lastPage)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Something went wrong.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadDirectors()

    return () => controller.abort()
  }, [token, pageNumber, activeSearch, refreshKey])

  // Find the Director's assigned school
  function getDirectorSchool(directorId) {
    const school = schools.find(
      (item) => Number(item.directorUserId) === Number(directorId)
    )

    return school ? school.name : 'Not assigned'
  }

  // Open create form
  function openCreateForm() {
    setEditingDirector(null)

    setFormData({
      fullName: '',
      loginId: '',
      password: '',
    })

    setFormError('')
    setShowForm(true)
  }

  // Open edit form
  function openEditForm(director) {
    setEditingDirector(director)

    setFormData({
      fullName: director.fullName,
      loginId: '',
      password: '',
    })

    setFormError('')
    setShowForm(true)
  }

  // Close form
  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingDirector(null)
    setFormError('')
  }

  // Handle inputs
  function handleInputChange(e) {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Create or update Director
  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!formData.fullName.trim()) {
      setFormError('Director name is required.')
      return
    }

    if (
      !editingDirector &&
      (!formData.loginId.trim() || !formData.password)
    ) {
      setFormError('Login ID and password are required.')
      return
    }

    const payload = editingDirector
      ? {
          fullName: formData.fullName.trim(),
        }
      : {
          fullName: formData.fullName.trim(),
          loginId: formData.loginId.trim(),
          password: formData.password,
          role: 2,
        }

    setSaving(true)

    try {
      const response = await fetch(
        editingDirector
          ? `${API}/Users/${editingDirector.id}`
          : `${API}/Users`,
        {
          method: editingDirector ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Failed to save Director.')
        )
      }

      setShowForm(false)
      setEditingDirector(null)
      setPageNumber(1)
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // Delete Director
  async function handleDelete(director) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${director.fullName}?`
    )

    if (!confirmed) return

    setError('')

    try {
      const response = await fetch(
        `${API}/Users/${director.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Failed to delete Director.')
        )
      }

      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
  }

  // Handle search input
  function handleSearchChange(e) {
    setSearch(e.target.value)
  }

  // Submit search
  function handleSearch(e) {
    e.preventDefault()

    const nextSearch = search.trim()

    if (nextSearch === activeSearch && pageNumber === 1) {
      return
    }

    setError('')
    setPageNumber(1)
    setActiveSearch(nextSearch)
  }

  // Clear search and return to normal paginated results
  function handleClearSearch() {
    setSearch('')
    setActiveSearch('')
    setPageNumber(1)
    setError('')
  }

  // Pagination
  function goToPreviousPage() {
    setPageNumber((previous) => Math.max(previous - 1, 1))
  }

  function goToNextPage() {
    setPageNumber((previous) =>
      Math.min(previous + 1, totalPages)
    )
  }

  if (loading && directors.length === 0) {
    return (
      <section className="dashboard-content">
        <p>Loading Directors...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">
      <div className="students-page-header">
        <div>
          <h2>University Directors</h2>
          <p>Manage Directors and view their assigned schools.</p>
        </div>

        <div className="students-header-actions">
          <button
            className="schools-add-button"
            onClick={openCreateForm}
          >
            + Add Director
          </button>
        </div>
      </div>

      {error && (
        <p className="schools-error" role="alert">
          {error}
        </p>
      )}

      {/* Search */}
      <form
        className="students-search-form"
        onSubmit={handleSearch}
      >
        <input
          className="students-search"
          type="text"
          placeholder="Search by Director name..."
          value={search}
          onChange={handleSearchChange}
        />

        <button
          type="submit"
          className="students-search-button"
        >
          Search
        </button>

        <button
          type="button"
          className="students-search-button"
          onClick={handleClearSearch}
        >
          Clear
        </button>
      </form>

      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>Director</th>
              <th>Assigned School</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {directors.length > 0 ? (
              directors.map((director) => (
                <tr key={director.id}>
                  <td>{director.fullName}</td>
                  
                  <td>{getDirectorSchool(director.id)}</td>

                  <td>
                    <div className="schools-actions">
                      <button
                        className="schools-edit-button"
                        onClick={() => openEditForm(director)}
                      >
                        Edit
                      </button>

                      <button
                        className="schools-delete-button"
                        onClick={() => handleDelete(director)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="schools-empty">
                  {loading ? 'Loading Directors...' : 'No Directors found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="students-pagination">
        <button
          type="button"
          className="students-pagination-button"
          onClick={goToPreviousPage}
          disabled={pageNumber <= 1 || loading}
        >
          Previous
        </button>

        <span className="students-page-info">
          Page {pageNumber} of {Math.max(totalPages, 1)}
          {' | '}
          {totalCount} Directors
        </span>

        <button
          type="button"
          className="students-pagination-button"
          onClick={goToNextPage}
          disabled={pageNumber >= totalPages || loading}
        >
          Next
        </button>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="schools-modal-overlay">
          <div className="schools-modal">

            <div className="schools-modal-header">
              <h3>
                {editingDirector ? 'Edit Director' : 'Create Director'}
              </h3>

              <button
                type="button"
                className="schools-close-button"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="schools-error" role="alert">
                  {formError}
                </div>
              )}

              <label htmlFor="director-name">
                Full Name
              </label>

              <input
                id="director-name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter Director name"
                required
              />

              {!editingDirector && (
                <>
                  <label htmlFor="director-login">
                    Login ID
                  </label>

                  <input
                    id="director-login"
                    name="loginId"
                    type="text"
                    value={formData.loginId}
                    onChange={handleInputChange}
                    placeholder="Enter Login ID"
                    required
                  />

                  <label htmlFor="director-password">
                    Temporary Password
                  </label>

                  <input
                    id="director-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter temporary password"
                    required
                  />
                </>
              )}

              <div className="schools-modal-actions">
                <button
                  type="button"
                  className="schools-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="schools-save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingDirector
                      ? 'Save Changes'
                      : 'Create Director'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </section>
  )
}

export default DirectorsPage
