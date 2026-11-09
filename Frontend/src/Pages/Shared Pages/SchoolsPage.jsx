
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const API = 'https://localhost:7245/api'

function SchoolsPage() {
  const { user } = useAuth()

  const [schools, setSchools] = useState([])
  const [directors, setDirectors] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingSchool, setEditingSchool] = useState(null)

  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    directorUserId: '',
  })

  // Load schools and available Directors
  useEffect(() => {
    async function loadData() {
      if (!user?.token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const headers = {
          Authorization: `Bearer ${user.token}`,
        }

        const [schoolsResponse, usersResponse] = await Promise.all([
          fetch(`${API}/Schools`, { headers }),
          fetch(`${API}/Users`, { headers }),
        ])

        if (!schoolsResponse.ok || !usersResponse.ok) {
          throw new Error('Failed to load schools or users.')
        }

        const schoolsData = await schoolsResponse.json()
        const usersData = await usersResponse.json()

        setSchools(schoolsData)

        // Director = 2 in the UserRole enum
        setDirectors(
          usersData.filter(
            (item) => item.role === 2 || item.role === 'Director'
          )
        )
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.token, refreshKey])

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
      directorUserId: String(school.directorUserId),
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
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)

        throw new Error(
          result?.message || 'Failed to save the school.'
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
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)

        throw new Error(
          result?.message || 'Failed to delete the school.'
        )
      }

      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
  }

  // Get Director name using DirectorUserId
  function getDirectorName(directorUserId) {
    const director = directors.find(
      (item) => item.id === directorUserId
    )

    return director
      ? director.fullName
      : `Director ID: ${directorUserId}`
  }

  // Filter schools
  const filteredSchools = schools.filter((school) => {
    const directorName = getDirectorName(school.directorUserId)

    return [
      school.name,
      directorName,
      String(school.directorUserId),
    ].some((value) =>
      (value ?? '').toLowerCase().includes(search.toLowerCase())
    )
  })

  if (loading) {
    return (
      <section className="dashboard-content">
        <p>Loading schools...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">

      {/* Page Header */}
      <div className="students-page-header">
        <div>
          <h2>University Schools</h2>
          <p>Manage university schools and their assigned Directors.</p>
        </div>

        <div className="students-header-actions">
          <span className="students-count">
            {filteredSchools.length} schools
          </span>

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
      <input
        className="students-search"
        type="text"
        placeholder="Search by school name, Director, or Director ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Schools Table */}
      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>School Name</th>
              <th>Director</th>
              <th>Director User ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <tr key={school.id}>
                  <td>#{school.id}</td>

                  <td>{school.name}</td>

                  <td>
                    {getDirectorName(school.directorUserId)}
                  </td>

                  <td>{school.directorUserId}</td>

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
                  No schools found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
              >
                <option value="">
                  Select a Director
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

              {directors.length === 0 && (
                <p className="students-form-note">
                  No Directors found.
                </p>
              )}

              <button
                type="submit"
                className="students-save-button"
                disabled={saving || directors.length === 0}
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
