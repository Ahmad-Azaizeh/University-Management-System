
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const API = 'https://localhost:7245/api'
const PAGE_SIZE = 10

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null)

  return result?.message || result?.detail || result?.title || fallback
}

function SchoolsPage() {
  const { user } = useAuth()
  const token = user?.token

  const [schools, setSchools] = useState([])
  const [directors, setDirectors] = useState([])

  const [loading, setLoading] = useState(true)
  const [directorsLoading, setDirectorsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingSchool, setEditingSchool] = useState(null)

  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    directorUserId: '',
  })

  // Load paginated schools
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadSchools() {
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
          `${API}/Schools?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(response, 'Failed to load schools.')
          )
        }

        const data = await response.json()

        const pages = data.totalPages ??
          Math.ceil(data.totalCount / PAGE_SIZE)

        setSchools(data.items ?? [])
        setTotalCount(data.totalCount ?? 0)
        setTotalPages(pages)

        if (pages > 0 && pageNumber > pages) {
          setPageNumber(pages)
        }
      } catch (err) {
        if (controller.signal.aborted) return

        setError(err.message || 'Something went wrong.')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSchools()

    return () => controller.abort()
  }, [token, pageNumber, activeSearch, refreshKey])

  // Load available Directors
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadDirectors() {
      setDirectorsLoading(true)

      try {
        const response = await fetch(
          `${API}/Users/directors?pageNumber=1&pageSize=100`,
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
        setDirectors(data.items ?? [])
      } catch (err) {
        if (controller.signal.aborted) return

        setError(err.message || 'Something went wrong.')
      } finally {
        if (!controller.signal.aborted) {
          setDirectorsLoading(false)
        }
      }
    }

    loadDirectors()

    return () => controller.abort()
  }, [token])

  // Open create form
  function openCreateForm() {
    setEditingSchool(null)

    setFormData({
      name: '',
      directorUserId: '',
    })

    setError('')
    setShowForm(true)
  }

  // Open edit form
  function openEditForm(school) {
    setEditingSchool(school)

    setFormData({
      name: school.name,
      directorUserId: String(school.directorUserId ?? ''),
    })

    setError('')
    setShowForm(true)
  }

  // Close form
  function closeForm() {
    setShowForm(false)
    setEditingSchool(null)
    setError('')
  }

  // Handle form inputs
  function handleInputChange(e) {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Create or update school
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || !formData.directorUserId) {
      setError('School name and Director are required.')
      return
    }

    const payload = {
      name: formData.name.trim(),
      directorUserId: Number(formData.directorUserId),
    }

    setSaving(true)

    try {
      const response = await fetch(
        editingSchool
          ? `${API}/Schools/${editingSchool.id}`
          : `${API}/Schools`,
        {
          method: editingSchool ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Failed to save the school.')
        )
      }

      closeForm()
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // Delete school
  async function handleDelete(school) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${school.name}?`
    )

    if (!confirmed) return

    setError('')

    try {
      const response = await fetch(
        `${API}/Schools/${school.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Failed to delete the school.')
        )
      }

      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
  }

  // Get Director name
  function getDirectorName(directorUserId) {
    const director = directors.find(
      (item) => Number(item.id) === Number(directorUserId)
    )

    return director
      ? director.fullName
      : `Director ID: ${directorUserId}`
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

  if (loading && schools.length === 0) {
    return (
      <section className="dashboard-content">
        <p>Loading schools...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">

      <div className="students-page-header">
        <div>
          <h2>University Schools</h2>
          <p>Manage university schools and their assigned Directors.</p>
        </div>

        <div className="students-header-actions">
          <button
            className="students-add-button"
            onClick={openCreateForm}
          >
            + Add School
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && !showForm && (
        <p className="students-error" role="alert">
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
          placeholder="Search by school name..."
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

      {/* Schools Table */}
      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Director</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {schools.length > 0 ? (
              schools.map((school) => (
                <tr key={school.id}>
          
                  <td>{school.name}</td>

                  <td>
                    {getDirectorName(school.directorUserId)}
                  </td>

                  <td>
                    <div className="students-actions">
                      <button
                        className="students-edit-button"
                        onClick={() => openEditForm(school)}
                      >
                        Edit
                      </button>

                      <button
                        className="students-delete-button"
                        onClick={() => handleDelete(school)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  {loading ? 'Loading schools...' : 'No schools found.'}
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
          {totalCount} schools
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
        <div className="students-modal-overlay">
          <div className="students-modal">

            <div className="students-modal-header">
              <h2>
                {editingSchool ? 'Edit School' : 'Create School'}
              </h2>

              <button
                type="button"
                className="students-close-button"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {error && (
                <p className="students-error" role="alert">
                  {error}
                </p>
              )}

              <label htmlFor="school-name">
                School Name
              </label>

              <input
                id="school-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter school name"
                required
              />

              <label htmlFor="school-director">
                Assign Director
              </label>

              <select
                id="school-director"
                name="directorUserId"
                value={formData.directorUserId}
                onChange={handleInputChange}
                required
                disabled={directorsLoading}
              >
                <option value="">
                  {directorsLoading
                    ? 'Loading Directors...'
                    : 'Select a Director'}
                </option>

                {directors.map((director) => (
                  <option
                    key={director.id}
                    value={director.id}
                  >
                    {director.fullName} ({director.loginId})
                  </option>
                ))}
              </select>

              {directors.length === 0 && !directorsLoading && (
                <p className="students-form-note">
                  No Directors found.
                </p>
              )}

              <button
                type="submit"
                className="students-save-button"
                disabled={saving || directorsLoading || directors.length === 0}
              >
                {saving
                  ? 'Saving...'
                  : editingSchool
                    ? 'Save Changes'
                    : 'Create School'}
              </button>

            </form>
          </div>
        </div>
      )}

    </section>
  )
}

export default SchoolsPage
