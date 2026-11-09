
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function DirectorsPage() {
  const { user } = useAuth()

  const [directors, setDirectors] = useState([])
  const [schools, setSchools] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDirector, setEditingDirector] = useState(null)

  const [refreshKey, setRefreshKey] = useState(0)

  const [formData, setFormData] = useState({
    fullName: '',
    loginId: '',
    password: '',
  })

  // Read an API error response
  async function getErrorMessage(response, fallback) {
    const result = await response.json().catch(() => null)

    return (
      result?.message ||
      result?.title ||
      result?.detail ||
      fallback
    )
  }

  // Load Directors and Schools
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

        const [usersResponse, schoolsResponse] = await Promise.all([
          fetch(`${API}/Users`, { headers }),
          fetch(`${API}/Schools`, { headers }),
        ])

        if (!usersResponse.ok) {
          throw new Error(
            await getErrorMessage(usersResponse, 'Failed to load users.')
          )
        }

        if (!schoolsResponse.ok) {
          throw new Error(
            await getErrorMessage(schoolsResponse, 'Failed to load schools.')
          )
        }

        const usersData = await usersResponse.json()
        const schoolsData = await schoolsResponse.json()

        const directorUsers = usersData.filter(
          (item) => item.role === 2 || item.role === 'Director'
        )

        setDirectors(directorUsers)
        setSchools(schoolsData)
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.token, refreshKey])

  // Find the Director's assigned school
  function getDirectorSchool(directorId) {
    const school = schools.find(
      (item) => item.directorUserId === directorId
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
            Authorization: `Bearer ${user.token}`,
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
            Authorization: `Bearer ${user.token}`,
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

  // Search Directors
  const filteredDirectors = directors.filter((director) => {
    const schoolName = getDirectorSchool(director.id)

    return [
      director.fullName,
      director.loginId,
      schoolName,
    ].some((value) =>
      (value ?? '').toLowerCase().includes(search.toLowerCase())
    )
  })

  if (loading) {
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
          <span className="students-count">
            {filteredDirectors.length} Directors
          </span>

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

      <input
        className="students-search"
        type="text"
        placeholder="Search by name, Login ID, or school..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>Director</th>
              <th>Login ID</th>
              <th>Assigned School</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredDirectors.length > 0 ? (
              filteredDirectors.map((director) => (
                <tr key={director.id}>
                  <td>{director.fullName}</td>
                  <td>{director.loginId}</td>
                  <td>{getDirectorSchool(director.id)}</td>
                  <td>
                    {director.mustChangePassword
                      ? 'Must change password'
                      : 'Active'}
                  </td>
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
                  No Directors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
