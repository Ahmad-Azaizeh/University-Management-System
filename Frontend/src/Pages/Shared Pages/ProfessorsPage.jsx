import { Fragment, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API_URL = 'https://localhost:7245/api'

function ProfessorsPage() {
  const { user } = useAuth()

  const [professors, setProfessors] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')

  const [selectedProfessorId, setSelectedProfessorId] = useState(null)
  const [professorCourses, setProfessorCourses] = useState({})
  const [courseLoading, setCourseLoading] = useState({})
  const [courseErrors, setCourseErrors] = useState({})

  const [showForm, setShowForm] = useState(false)
  const [editingProfessor, setEditingProfessor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingProfessorId, setDeletingProfessorId] = useState(null)

  const [formData, setFormData] = useState({
    fullName: '',
    loginId: '',
    password: '',
    employeeNumber: '',
    schoolId: '',
  })

  const isPresident =
    user?.role === 3 || user?.role === 'President'

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = {
          Authorization: `Bearer ${user.token}`,
        }

        const professorsResponse = await fetch(
          `${API_URL}/Professors`,
          { headers }
        )

        if (!professorsResponse.ok) {
          throw new Error('Failed to load professors.')
        }

        const professorsData = await professorsResponse.json()
        setProfessors(professorsData)

        if (isPresident) {
          const schoolsResponse = await fetch(
            `${API_URL}/Schools`,
            { headers }
          )

          if (!schoolsResponse.ok) {
            throw new Error('Failed to load schools.')
          }

          const schoolsData = await schoolsResponse.json()
          setSchools(schoolsData)
        }
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    if (user?.token) {
      fetchData()
    }
  }, [user, isPresident])

  async function handleProfessorView(professorId) {
    if (selectedProfessorId === professorId) {
      setSelectedProfessorId(null)
      return
    }

    setSelectedProfessorId(professorId)

    if (professorCourses[professorId]) return

    setCourseLoading((previous) => ({
      ...previous,
      [professorId]: true,
    }))

    setCourseErrors((previous) => ({
      ...previous,
      [professorId]: '',
    }))

    try {
      const response = await fetch(`${API_URL}/Courses`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load assigned courses.')
      }

      const data = await response.json()

      const assignedCourses = data.filter(
        (course) => course.professorId === professorId
      )

      setProfessorCourses((previous) => ({
        ...previous,
        [professorId]: assignedCourses,
      }))
    } catch (err) {
      setCourseErrors((previous) => ({
        ...previous,
        [professorId]: err.message || 'Something went wrong.',
      }))
    } finally {
      setCourseLoading((previous) => ({
        ...previous,
        [professorId]: false,
      }))
    }
  }

  function openCreateForm() {
    setEditingProfessor(null)
    setFormError('')
    setFormData({
      fullName: '',
      loginId: '',
      password: '',
      employeeNumber: '',
      schoolId: '',
    })
    setShowForm(true)
  }

  function openEditForm(professor) {
    setEditingProfessor(professor)
    setFormError('')
    setFormData({
      fullName: professor.fullName,
      loginId: '',
      password: '',
      employeeNumber: professor.employeeNumber,
      schoolId: String(professor.schoolId),
    })
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingProfessor(null)
    setFormError('')
  }

  function handleFormChange(e) {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (
      !formData.fullName.trim() ||
      (!editingProfessor &&
        (!formData.loginId.trim() ||
          !formData.password.trim() ||
          !formData.employeeNumber.trim()))
    ) {
      setFormError('Please fill in all required fields.')
      return
    }

    if (isPresident && !formData.schoolId) {
      setFormError('Please select a school.')
      return
    }

    setSaving(true)

    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      }

      let response

      if (editingProfessor) {
        response = await fetch(
          `${API_URL}/Users/${editingProfessor.userId}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              fullName: formData.fullName.trim(),
            }),
          }
        )
      } else {
        const newProfessor = {
          fullName: formData.fullName.trim(),
          loginId: formData.loginId.trim(),
          password: formData.password,
          role: 1,
          employeeNumber: formData.employeeNumber.trim(),
          ...(isPresident && {
            schoolId: Number(formData.schoolId),
          }),
        }

        response = await fetch(`${API_URL}/Users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newProfessor),
        })
      }

      if (!response.ok) {
        const message = await response.text()
        throw new Error(
          message || `Failed to ${editingProfessor ? 'update' : 'create'} professor.`
        )
      }

      const professorsResponse = await fetch(
        `${API_URL}/Professors`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!professorsResponse.ok) {
        throw new Error('Professor saved, but the list could not be refreshed.')
      }

      const updatedProfessors = await professorsResponse.json()
      setProfessors(updatedProfessors)

      setProfessorCourses({})
      setSelectedProfessorId(null)
      setShowForm(false)
      setEditingProfessor(null)
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(professor) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${professor.fullName}?`
    )

    if (!confirmed) return

    setError('')
    setDeletingProfessorId(professor.id)

    try {
      const response = await fetch(
        `${API_URL}/Professors/${professor.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!response.ok) {
        const responseText = await response.text()
        let message = responseText

        try {
          const data = JSON.parse(responseText)
          message = data.message || responseText
        } catch {
          throw new Error(responseText || 'Failed to delete professor.')
        }

        throw new Error(message || 'Failed to delete professor.')
      }

      setProfessors((previous) =>
        previous.filter((p) => p.id !== professor.id)
      )

      setProfessorCourses((previous) => {
        const updated = { ...previous }
        delete updated[professor.id]
        return updated
      })

      if (selectedProfessorId === professor.id) {
        setSelectedProfessorId(null)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setDeletingProfessorId(null)
    }
  }

  const filteredProfessors = professors.filter((professor) =>
    [
      professor.fullName,
      professor.employeeNumber,
      professor.schoolName,
    ].some((value) =>
      (value ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  if (loading) {
    return (
      <section className="dashboard-content">
        <p>Loading professors...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">
      <div className="students-page-header">
        <div>
          <h2>Professors</h2>
          <p>
            {isPresident
              ? 'Manage professors across all university schools.'
              : 'Manage professors registered in your school.'}
          </p>
        </div>

        <div className="students-header-actions">
          <span className="students-count">
            {filteredProfessors.length} professors
          </span>

          <button
            className="students-add-button"
            onClick={openCreateForm}
          >
            + Add Professor
          </button>
        </div>
      </div>

      {error && <p className="students-error">{error}</p>}

      <input
        className="students-search"
        type="text"
        placeholder="Search by name, employee number, or school..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>Professor</th>
              <th>Employee Number</th>
              <th>School</th>
              <th>Assigned Courses</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProfessors.map((professor) => (
              <Fragment key={professor.id}>
                <tr>
                  <td>{professor.fullName}</td>
                  <td>{professor.employeeNumber}</td>
                  <td>{professor.schoolName}</td>
                  <td>{professor.courseCount}</td>
                  <td>
                    <button
                      className="student-details-button"
                      onClick={() =>
                        handleProfessorView(professor.id)
                      }
                    >
                      {selectedProfessorId === professor.id
                        ? 'Hide'
                        : 'View'}
                    </button>
                  </td>
                  <td>
                    <div className="students-actions">
                      <button
                        className="students-edit-button"
                        onClick={() => openEditForm(professor)}
                      >
                        Edit
                      </button>

                      <button
                        className="students-delete-button"
                        disabled={deletingProfessorId === professor.id}
                        onClick={() => handleDelete(professor)}
                      >
                        {deletingProfessorId === professor.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>

                {selectedProfessorId === professor.id && (
                  <tr>
                    <td colSpan="6">
                      <div className="student-enrollments">
                        <h3>
                          Courses assigned to {professor.fullName}
                        </h3>

                        {courseLoading[professor.id] && (
                          <p>Loading courses...</p>
                        )}

                        {courseErrors[professor.id] && (
                          <p className="students-error">
                            {courseErrors[professor.id]}
                          </p>
                        )}

                        {!courseLoading[professor.id] &&
                          !courseErrors[professor.id] &&
                          professorCourses[professor.id] && (
                            professorCourses[professor.id].length === 0 ? (
                              <p>No courses assigned.</p>
                            ) : (
                              <table className="student-courses-table">
                                <thead>
                                  <tr>
                                    <th>Course Name</th>
                                    <th>Course Code</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {professorCourses[professor.id].map(
                                    (course) => (
                                      <tr key={course.id}>
                                        <td>{course.name}</td>
                                        <td>{course.code}</td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            )
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}

            {filteredProfessors.length === 0 && (
              <tr>
                <td colSpan="6">No professors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="students-modal-overlay">
          <div className="students-modal">
            <div className="students-modal-header">
              <h2>
                {editingProfessor ? 'Edit Professor' : 'Add Professor'}
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
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
                required
              />

              {!editingProfessor && (
                <>
                  <label>Login ID</label>
                  <input
                    type="text"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleFormChange}
                    required
                  />

                  <label>Temporary Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                  />

                  <label>Employee Number</label>
                  <input
                    type="text"
                    name="employeeNumber"
                    value={formData.employeeNumber}
                    onChange={handleFormChange}
                    required
                  />

                  {isPresident && (
                    <>
                      <label>School</label>
                      <select
                        name="schoolId"
                        value={formData.schoolId}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Select a school</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {!isPresident && (
                    <p className="students-form-note">
                      The professor will automatically be assigned to your school.
                    </p>
                  )}
                </>
              )}

              {formError && (
                <p className="students-error">{formError}</p>
              )}

              <button
                type="submit"
                className="students-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingProfessor
                    ? 'Save Changes'
                    : 'Create Professor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProfessorsPage