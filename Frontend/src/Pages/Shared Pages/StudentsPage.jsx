
import { Fragment, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'
const PAGE_SIZE = 10
const LOOKUP_PAGE_SIZE = 100

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null)
  return result?.message || result?.title || result?.detail || fallback
}

async function fetchAllPages(endpoint, token, signal) {
  let allItems = []
  let currentPage = 1

  while (true) {
    const params = new URLSearchParams({
      pageNumber: String(currentPage),
      pageSize: String(LOOKUP_PAGE_SIZE),
    })

    const response = await fetch(
      `${API}/${endpoint}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to load ${endpoint.toLowerCase()}.`)
    }

    const data = await response.json()

    allItems = [...allItems, ...(data.items || [])]

    if (currentPage >= (data.totalPages || 1)) {
      break
    }

    currentPage += 1
  }

  return allItems
}

function StudentsPage() {
  const { user } = useAuth()

  const [students, setStudents] = useState([])
  const [schools, setSchools] = useState([])
  const [courses, setCourses] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const isPresident =
    user?.role === 3 || user?.role === 'President'

  const [formData, setFormData] = useState({
    fullName: '',
    loginId: '',
    password: '',
    studentNumber: '',
    schoolId: '',
  })

  // Load schools and courses for filter dropdowns
  useEffect(() => {
    if (!user?.token) return

    const controller = new AbortController()

    async function loadFilters() {
      try {
        if (isPresident) {
          const schoolsData = await fetchAllPages(
            'Schools',
            user.token,
            controller.signal
          )

          setSchools(schoolsData)
        } else {
          setSchools([])
        }

        const coursesData = await fetchAllPages(
          'Courses',
          user.token,
          controller.signal
        )

        setCourses(coursesData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load filter options.')
        }
      }
    }

    loadFilters()

    return () => controller.abort()
  }, [user?.token, isPresident])

  // Fetch paginated students using backend filters
  useEffect(() => {
    const controller = new AbortController()

    async function loadStudents() {
      if (!user?.token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams({
          pageNumber: String(pageNumber),
          pageSize: String(PAGE_SIZE),
        })

        if (activeSearch) {
          params.set('searchTerm', activeSearch)
        }

        if (selectedSchoolId) {
          params.set('schoolId', selectedSchoolId)
        }

        if (selectedCourseId) {
          params.set('courseId', selectedCourseId)
        }

        const studentsResponse = await fetch(
          `${API}/Students?${params}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
            signal: controller.signal,
          }
        )

        if (!studentsResponse.ok) {
          throw new Error(
            await getErrorMessage(
              studentsResponse,
              'Failed to load students.'
            )
          )
        }

        const studentsData = await studentsResponse.json()

        setStudents(studentsData.items || [])
        setTotalCount(studentsData.totalCount || 0)
        setTotalPages(studentsData.totalPages || 1)

        const lastPage = Math.max(studentsData.totalPages || 1, 1)

        if (pageNumber > lastPage) {
          setPageNumber(lastPage)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadStudents()

    return () => controller.abort()
  }, [
    user?.token,
    refreshKey,
    pageNumber,
    activeSearch,
    selectedSchoolId,
    selectedCourseId,
  ])

  // Search students
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

  // Filter by school
  function handleSchoolFilterChange(e) {
    setSelectedSchoolId(e.target.value)
    setSelectedCourseId('')
    setPageNumber(1)
    setError('')
  }

  // Filter by course
  function handleCourseFilterChange(e) {
    setSelectedCourseId(e.target.value)
    setPageNumber(1)
    setError('')
  }

  // Clear search and all filters
  function handleClearSearch() {
    setSearch('')
    setActiveSearch('')
    setSelectedSchoolId('')
    setSelectedCourseId('')
    setPageNumber(1)
    setError('')
  }

  // Open create form
  function openCreateForm() {
    setEditingStudent(null)

    setFormData({
      fullName: '',
      loginId: '',
      password: '',
      studentNumber: '',
      schoolId: '',
    })

    setError('')
    setShowForm(true)
  }

  // Open edit form
  function openEditForm(student) {
    setEditingStudent(student)

    setFormData({
      fullName: student.fullName || '',
      loginId: '',
      password: '',
      studentNumber: student.studentNumber || '',
      schoolId: String(student.schoolId || ''),
    })

    setError('')
    setShowForm(true)
  }

  // Close form
  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingStudent(null)
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

  // Create or update student
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.fullName.trim()) {
      setError('Student name is required.')
      return
    }

    if (editingStudent) {
      await updateStudent()
    } else {
      await createStudent()
    }
  }

  async function createStudent() {
    if (
      !formData.loginId.trim() ||
      !formData.password ||
      !formData.studentNumber.trim()
    ) {
      setError('Please complete all required fields.')
      return
    }

    if (isPresident && !formData.schoolId) {
      setError('Please select a school.')
      return
    }

    const payload = {
      fullName: formData.fullName.trim(),
      loginId: formData.loginId.trim(),
      password: formData.password,
      role: 0,
      studentNumber: formData.studentNumber.trim(),
      ...(isPresident && {
        schoolId: Number(formData.schoolId),
      }),
    }

    setSaving(true)

    try {
      const response = await fetch(`${API}/Users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Failed to create student.'
          )
        )
      }

      closeForm()
      setPageNumber(1)
      setActiveSearch('')
      setSearch('')
      setSelectedSchoolId('')
      setSelectedCourseId('')
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function updateStudent() {
    setSaving(true)

    try {
      const response = await fetch(
        `${API}/Users/${editingStudent.userId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName.trim(),
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Failed to update student.'
          )
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

  // Delete student
  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.fullName}?`
    )

    if (!confirmed) return

    setError('')

    try {
      const response = await fetch(
        `${API}/Students/${student.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Failed to delete student.'
          )
        )
      }

      if (selectedStudentId === student.id) {
        setSelectedStudentId(null)
      }

      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
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

  // Keep course dropdown options relevant to the selected school
  const availableFilterCourses = isPresident
    ? courses.filter(
        (course) =>
          !selectedSchoolId ||
          Number(course.schoolId) === Number(selectedSchoolId)
      )
    : courses

  if (loading) {
    return (
      <section className="dashboard-content">
        <p>Loading students...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">
      <div className="students-page-header">
        <div>
          <h2>Students</h2>
          <p>
            {isPresident
              ? 'Manage students across all university schools.'
              : 'Manage students in your school.'}
          </p>
        </div>

        <div className="students-header-actions">
          <button
            type="button"
            className="students-add-button"
            onClick={openCreateForm}
          >
            + Add Student
          </button>
        </div>
      </div>

      {error && (
        <p className="students-error">{error}</p>
      )}

      {/* Search and Filters */}
      <form
        className="students-search-form"
        onSubmit={handleSearch}
      >
        <input
          className="students-search"
          type="text"
          placeholder="Search by name or student number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

        {isPresident && (
          <select
            className="students-search"
            value={selectedSchoolId}
            onChange={handleSchoolFilterChange}
          >
            <option value="">All Schools</option>

            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        )}

        <select
          className="students-search"
          value={selectedCourseId}
          onChange={handleCourseFilterChange}
        >
          <option value="">All Courses</option>

          {availableFilterCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>

        
      </form>

      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Student Number</th>
              <th>School</th>
              <th>Courses</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => {
              const enrollments = (student.enrollments || []).filter(
                (enrollment) =>
                  [0, 3, 4].includes(Number(enrollment.status))
              )

              return (
                <Fragment key={student.id}>
                  <tr>
                    <td>{student.fullName}</td>
                    <td>{student.studentNumber}</td>
                    <td>{student.schoolName}</td>
                    <td>{enrollments.length}</td>

                    <td>
                      <button
                        type="button"
                        className="student-details-button"
                        onClick={() =>
                          setSelectedStudentId(
                            selectedStudentId === student.id
                              ? null
                              : student.id
                          )
                        }
                      >
                        {selectedStudentId === student.id
                          ? 'Hide'
                          : 'View'}
                      </button>
                    </td>

                    <td>
                      <div className="students-actions">
                        <button
                          type="button"
                          className="students-edit-button"
                          onClick={() => openEditForm(student)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="students-delete-button"
                          onClick={() => handleDelete(student)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {selectedStudentId === student.id && (
                    <tr>
                      <td colSpan="6">
                        <div className="student-enrollments">
                          <h3>Courses — {student.fullName}</h3>

                          {enrollments.length === 0 ? (
                            <p>No enrollments found.</p>
                          ) : (
                            <table className="student-courses-table">
                              <thead>
                                <tr>
                                  <th>Course</th>
                                  <th>Code</th>
                                  <th>Grade</th>
                                </tr>
                              </thead>

                              <tbody>
                                {enrollments.map((enrollment) => (
                                  <tr key={enrollment.enrollmentId}>
                                    <td>{enrollment.courseName}</td>
                                    <td>{enrollment.courseCode}</td>
                                    <td>
                                      {enrollment.grade ?? 'Not graded'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan="6">No students found.</td>
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
          {totalCount} students
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
              <h3>
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </h3>

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
              <label htmlFor="student-full-name">Full Name</label>
              <input
                id="student-full-name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />

              {!editingStudent && (
                <>
                  <label htmlFor="student-login-id">Login ID</label>
                  <input
                    id="student-login-id"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="student-password">
                    Initial Password
                  </label>
                  <input
                    id="student-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="student-number">
                    Student Number
                  </label>
                  <input
                    id="student-number"
                    name="studentNumber"
                    value={formData.studentNumber}
                    onChange={handleInputChange}
                    required
                  />

                  {isPresident && (
                    <>
                      <label htmlFor="student-school">School</label>
                      <select
                        id="student-school"
                        name="schoolId"
                        value={formData.schoolId}
                        onChange={handleInputChange}
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
                </>
              )}

              {editingStudent && (
                <p className="students-form-note">
                  Only the student's name can be changed here.
                </p>
              )}

              {error && (
                <p className="students-error">{error}</p>
              )}

              <button
                type="submit"
                className="students-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingStudent
                    ? 'Update Student'
                    : 'Create Student'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default StudentsPage
