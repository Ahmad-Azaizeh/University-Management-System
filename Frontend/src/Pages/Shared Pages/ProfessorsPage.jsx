
import { Fragment, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API_URL = 'https://localhost:7245/api'
const PAGE_SIZE = 10
const SCHOOL_PAGE_SIZE = 100

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null)

  return result?.message || result?.title || result?.detail || fallback
}

async function fetchAllPages(endpoint, token, signal, filters = {}) {
  let pageNumber = 1
  let totalPages = 1
  const allItems = []

  while (pageNumber <= totalPages) {
    const query = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(SCHOOL_PAGE_SIZE),
    })

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value))
      }
    })

    const response = await fetch(
      `${API_URL}/${endpoint}?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      }
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, `Failed to load ${endpoint}.`)
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

function ProfessorsPage() {
  const { user } = useAuth()
  const token = user?.token

  const [professors, setProfessors] = useState([])
  const [schools, setSchools] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')

  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

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

  // Load schools for the President
  useEffect(() => {
    if (!token || !isPresident) return

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
  }, [token, isPresident])

  // Load paginated professors
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadProfessors() {
      setLoading(true)

      try {
        const query = new URLSearchParams({
          pageNumber: String(pageNumber),
          pageSize: String(PAGE_SIZE),
        })

        if (activeSearch) {
          query.set('searchTerm', activeSearch)
        }

        if (isPresident && selectedSchoolId) {
          query.set('schoolId', selectedSchoolId)
        }

        const response = await fetch(
          `${API_URL}/Professors?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(response, 'Failed to load professors.')
          )
        }

        const data = await response.json()

        const pages = Math.max(
          data.totalPages ??
            Math.ceil((data.totalCount ?? 0) / PAGE_SIZE),
          1
        )

        setProfessors(data.items ?? [])
        setTotalCount(data.totalCount ?? 0)
        setTotalPages(pages)
        setError('')

        if (pageNumber > pages) {
          setPageNumber(pages)
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

    loadProfessors()

    return () => controller.abort()
  }, [
    token,
    isPresident,
    pageNumber,
    activeSearch,
    selectedSchoolId,
    refreshKey,
  ])

  // View courses assigned to a professor
  async function handleProfessorView(professor) {
    const professorId = professor.id

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
      const assignedCourses = await fetchAllPages(
        'Courses',
        token,
        undefined,
        { schoolId: professor.schoolId }
      )

      const filteredCourses = assignedCourses.filter(
        (course) => Number(course.professorId) === Number(professorId)
      )

      setProfessorCourses((previous) => ({
        ...previous,
        [professorId]: filteredCourses,
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

  // Open create form
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

  // Open edit form
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

  // Close form
  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingProfessor(null)
    setFormError('')
  }

  // Handle form inputs
  function handleFormChange(e) {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Create or update professor
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
        Authorization: `Bearer ${token}`,
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
        throw new Error(
          await getErrorMessage(
            response,
            `Failed to ${editingProfessor ? 'update' : 'create'} professor.`
          )
        )
      }

      setProfessorCourses({})
      setSelectedProfessorId(null)
      setShowForm(false)
      setEditingProfessor(null)
      setSearch('')
      setActiveSearch('')
      setSelectedSchoolId('')
      setPageNumber(1)
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // Delete professor
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
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Failed to delete professor.')
        )
      }

      if (professors.length === 1 && pageNumber > 1) {
        setPageNumber((previous) => previous - 1)
      }

      setRefreshKey((previous) => previous + 1)

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

  // Search professors
  function handleSearchSubmit(e) {
    e.preventDefault()
    setPageNumber(1)
    setSelectedProfessorId(null)
    setActiveSearch(search.trim())
  }

  // Clear search and school filter
  function handleClearSearch() {
    setSearch('')
    setActiveSearch('')
    setSelectedSchoolId('')
    setSelectedProfessorId(null)
    setPageNumber(1)
  }

  // Change school filter
  function handleSchoolChange(e) {
    setSelectedSchoolId(e.target.value)
    setSelectedProfessorId(null)
    setPageNumber(1)
  }

  function goToPreviousPage() {
    setPageNumber((previous) => Math.max(previous - 1, 1))
    setSelectedProfessorId(null)
  }

  function goToNextPage() {
    setPageNumber((previous) => Math.min(previous + 1, totalPages))
    setSelectedProfessorId(null)
  }

  if (loading && professors.length === 0) {
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
          
          <button
            type="button"
            className="students-add-button"
            onClick={openCreateForm}
          >
            + Add Professor
          </button>
        </div>
      </div>

      {error && <p className="students-error">{error}</p>}

      <form
        className="students-search-form"
        onSubmit={handleSearchSubmit}
      >
        <input
          className="students-search"
          type="text"
          placeholder="Search by professor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="students-search-button"
          type="submit"
        >
          Search
        </button>

        
          <button
            className="students-search-button"
            type="button"
            onClick={handleClearSearch}
          >
            Clear
          </button>

        {isPresident && (
          <select
            className="students-search"
            value={selectedSchoolId}
            onChange={handleSchoolChange}
            aria-label="Filter professors by school"
          >
            <option value="">All schools</option>

            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        )}

        
        
      </form>

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
            {professors.length > 0 ? (
              professors.map((professor) => (
                <Fragment key={professor.id}>
                  <tr>
                    <td>{professor.fullName}</td>
                    <td>{professor.employeeNumber}</td>
                    <td>{professor.schoolName}</td>
                    <td>{professor.courseCount}</td>

                    <td>
                      <button
                        type="button"
                        className="student-details-button"
                        onClick={() => handleProfessorView(professor)}
                      >
                        {selectedProfessorId === professor.id
                          ? 'Hide'
                          : 'View'}
                      </button>
                    </td>

                    <td>
                      <div className="students-actions">
                        <button
                          type="button"
                          className="students-edit-button"
                          onClick={() => openEditForm(professor)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
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
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  {loading ? 'Loading professors...' : 'No professors found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
        <div className="students-pagination">
          <button
            type="button"
            className="students-pagination-button"
            onClick={goToPreviousPage}
            disabled={pageNumber === 1 || loading}
          >
            Previous
          </button>

          <span className="students-page-info">
            Page {pageNumber} of {Math.max(totalPages, 1)}
            {' | '}
            {totalCount} professors
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
              <label htmlFor="professor-full-name">Full Name</label>
              <input
                id="professor-full-name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
                required
              />

              {!editingProfessor && (
                <>
                  <label htmlFor="professor-login-id">Login ID</label>
                  <input
                    id="professor-login-id"
                    type="text"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleFormChange}
                    required
                  />

                  <label htmlFor="professor-password">
                    Temporary Password
                  </label>
                  <input
                    id="professor-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                  />

                  <label htmlFor="professor-employee-number">
                    Employee Number
                  </label>
                  <input
                    id="professor-employee-number"
                    type="text"
                    name="employeeNumber"
                    value={formData.employeeNumber}
                    onChange={handleFormChange}
                    required
                  />

                  {isPresident && (
                    <>
                      <label htmlFor="professor-school">School</label>
                      <select
                        id="professor-school"
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
                <p className="students-error" role="alert">
                  {formError}
                </p>
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
