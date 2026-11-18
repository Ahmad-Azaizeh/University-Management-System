
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'
const PAGE_SIZE = 10
const LOOKUP_PAGE_SIZE = 100
const STUDENT_LOOKUP_PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 0 },
  { label: 'Pending', value: 1 },
  { label: 'Declined', value: 2 },
  { label: 'Completed', value: 3 },
  { label: 'Failed', value: 4 },
]

function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

function getStatusLabel(status) {
  const labels = {
    0: 'Approved',
    1: 'Pending',
    2: 'Declined',
    3: 'Completed',
    4: 'Failed',
  }

  return labels[Number(status)] ?? 'Unknown'
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}

async function getErrorMessage(response, fallback) {
  const errorData = await response.json().catch(() => null)

  return (
    errorData?.message ||
    errorData?.title ||
    errorData?.detail ||
    fallback
  )
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
        headers: getAuthHeaders(token),
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

function EnrollmentsPage() {
  const { user } = useAuth()
  const token = user?.token

  const isPresident =
    user?.role === 3 || user?.role === 'President'

  const [enrollments, setEnrollments] = useState([])
  const [studentResults, setStudentResults] = useState([])
  const [studentResultsQuery, setStudentResultsQuery] = useState('')
  const [courses, setCourses] = useState([])
  const [schools, setSchools] = useState([])

  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [loading, setLoading] = useState(true)
  const [studentLookupLoading, setStudentLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [studentLookupError, setStudentLookupError] = useState('')

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedSchool, setSelectedSchool] = useState('all')

  const [pageNumber, setPageNumber] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [saving, setSaving] = useState(false)

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Load courses and schools for dropdowns
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadReferenceData() {
      try {
        const coursesData = await fetchAllPages(
          'Courses',
          token,
          controller.signal
        )

        setCourses(coursesData)

        if (isPresident) {
          const schoolsData = await fetchAllPages(
            'Schools',
            token,
            controller.signal
          )

          setSchools(schoolsData)
        } else {
          setSchools([])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load enrollment data.')
        }
      }
    }

    loadReferenceData()

    return () => controller.abort()
  }, [token, isPresident])

  // Search students through the backend for direct enrollment
  useEffect(() => {
    if (!token || !studentSearch.trim()) return

    const controller = new AbortController()

    async function searchStudents() {
      try {
        const params = new URLSearchParams({
          pageNumber: '1',
          pageSize: String(STUDENT_LOOKUP_PAGE_SIZE),
          searchTerm: studentSearch.trim(),
        })

        const response = await fetch(
          `${API}/Students?${params}`,
          {
            headers: getAuthHeaders(token),
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              'Failed to search students.'
            )
          )
        }

        const data = await response.json()

        setStudentResults(data.items || [])
        setStudentResultsQuery(studentSearch.trim())
      } catch (err) {
        if (err.name !== 'AbortError') {
          setStudentLookupError(
            err.message || 'Something went wrong.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setStudentLookupLoading(false)
        }
      }
    }

    searchStudents()

    return () => controller.abort()
  }, [token, studentSearch])

  // Fetch enrollments using backend search and filters
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadEnrollments() {
      try {
        const params = new URLSearchParams({
          pageNumber: String(pageNumber),
          pageSize: String(PAGE_SIZE),
        })

        if (activeSearch) {
          params.set('searchTerm', activeSearch)
        }

        if (selectedStatus !== 'all') {
          params.set('status', String(selectedStatus))
        }

        if (selectedCourse !== 'all') {
          params.set('courseId', String(selectedCourse))
        }

        if (isPresident && selectedSchool !== 'all') {
          params.set('schoolId', String(selectedSchool))
        }

        const response = await fetch(
          `${API}/Enrollments?${params}`,
          {
            headers: getAuthHeaders(token),
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              'Failed to load enrollments.'
            )
          )
        }

        const data = await response.json()
        const responseTotalPages = data.totalPages || 1

        if (pageNumber > responseTotalPages) {
          setPageNumber(responseTotalPages)
          return
        }

        setEnrollments(data.items || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(responseTotalPages)
        setError('')
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

    loadEnrollments()

    return () => controller.abort()
  }, [
    token,
    pageNumber,
    activeSearch,
    selectedStatus,
    selectedCourse,
    selectedSchool,
    isPresident,
    refreshKey,
  ])

  // Submit enrollment search
  function handleSearch(e) {
    e.preventDefault()

    const nextSearch = search.trim()

    if (nextSearch === activeSearch && pageNumber === 1) {
      return
    }

    setError('')
    setLoading(true)
    setPageNumber(1)
    setActiveSearch(nextSearch)
  }

  function handleClearSearch() {
  setSearch('')
  setActiveSearch('')
  setSelectedStatus('all')
  setSelectedCourse('all')
  setSelectedSchool('all')
  setPageNumber(1)
}

  // Handle student picker input
  function handleStudentSearchChange(e) {
    const value = e.target.value

    setStudentSearch(value)
    setStudentLookupError('')
    setStudentLookupLoading(Boolean(value.trim()))
  }

  // Create direct enrollment
  async function handleCreateEnrollment(e) {
    e.preventDefault()

    if (!studentId || !courseId) {
      setActionError('Please select both a student and a course.')
      return
    }

    try {
      setSaving(true)
      setActionError('')

      const response = await fetch(`${API}/Enrollments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: Number(studentId),
          courseId: Number(courseId),
        }),
      })

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Failed to create enrollment.'
          )
        )
      }

      setStudentId('')
      setCourseId('')
      setSelectedStudent(null)
      setStudentSearch('')
      setStudentResults([])
      setStudentResultsQuery('')
      setStudentLookupError('')
      setStudentLookupLoading(false)
      setShowForm(false)

      setPageNumber(1)
      setLoading(true)
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // Approve or decline a pending request
  async function handleRequestAction(enrollmentId, action) {
    try {
      setActionError('')

      const response = await fetch(
        `${API}/Enrollments/${enrollmentId}/${action}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(token),
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            `Failed to ${action} request.`
          )
        )
      }

      setLoading(true)
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
    }
  }

  // Delete enrollment
  async function handleDeleteEnrollment(enrollment) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${enrollment.studentName}'s enrollment in ${enrollment.courseName}?`
    )

    if (!confirmed) return

    try {
      setActionError('')

      const response = await fetch(
        `${API}/Enrollments/${enrollment.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(token),
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Failed to delete enrollment.'
          )
        )
      }

      setLoading(true)
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
    }
  }

  // Pagination
  function goToPreviousPage() {
    setLoading(true)
    setPageNumber((previous) => Math.max(previous - 1, 1))
  }

  function goToNextPage() {
    setLoading(true)
    setPageNumber((previous) =>
      Math.min(previous + 1, totalPages)
    )
  }

  if (loading) {
    return <p>Loading enrollments...</p>
  }

  if (error) {
    return <p className="students-error">{error}</p>
  }

  return (
    <div className="dashboard-content enrollments-page">
      <div className="enrollments-page-header">
        <div>
          <h2>Enrollments</h2>
          <p>Manage student course enrollments and requests.</p>
        </div>

        <button
          type="button"
          className="enrollment-add-button"
          onClick={() => {
            setShowForm(!showForm)
            setActionError('')
          }}
        >
          {showForm ? 'Cancel' : '+ Add Enrollment'}
        </button>
      </div>

      {actionError && !showForm && (
        <p className="students-error">{actionError}</p>
      )}

      {showForm && (
        <form
          className="enrollment-form"
          onSubmit={handleCreateEnrollment}
        >
          <h3>Create Direct Enrollment</h3>

          <div className="enrollment-student-search">
            <label htmlFor="enrollment-student-search">
              Student
            </label>

            {selectedStudent ? (
              <div className="enrollment-selected-student">
                <div>
                  <strong>{selectedStudent.fullName}</strong>
                  <span>{selectedStudent.studentNumber}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null)
                    setStudentId('')
                    setStudentSearch('')
                    setStudentResults([])
                    setStudentResultsQuery('')
                    setStudentLookupError('')
                    setStudentLookupLoading(false)
                  }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <>
                <input
                  id="enrollment-student-search"
                  type="text"
                  placeholder="Search by student name or number..."
                  value={studentSearch}
                  onChange={handleStudentSearchChange}
                />

                {studentLookupLoading && (
                  <p>Searching students...</p>
                )}

                {studentLookupError && (
                  <p className="students-error">
                    {studentLookupError}
                  </p>
                )}

                {studentSearch.trim() &&
                  studentResultsQuery === studentSearch.trim() &&
                  !studentLookupLoading && (
                    <div className="enrollment-student-results">
                      {studentResults.length > 0 ? (
                        studentResults.map((student) => (
                          <button
                            type="button"
                            key={student.id}
                            onClick={() => {
                              setSelectedStudent(student)
                              setStudentId(String(student.id))
                              setStudentSearch('')
                              setStudentResults([])
                              setStudentResultsQuery('')
                              setStudentLookupError('')
                              setStudentLookupLoading(false)
                            }}
                          >
                            <strong>{student.fullName}</strong>
                            <span>{student.studentNumber}</span>
                          </button>
                        ))
                      ) : (
                        <p>No students found.</p>
                      )}
                    </div>
                  )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="enrollment-course">Course</label>
            <select
              id="enrollment-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              <option value="">Select a course</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.code}
                </option>
              ))}
            </select>
          </div>

          {actionError && (
            <p className="students-error">{actionError}</p>
          )}

          <button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Enrollment'}
          </button>
        </form>
      )}

      {/* Status filters */}
      <div className="enrollment-status-filters">
        {STATUS_OPTIONS.map((status) => (
          <button
            type="button"
            key={String(status.value)}
            className={
              selectedStatus === status.value
                ? 'enrollment-filter active'
                : 'enrollment-filter'
            }
            onClick={() => {
              setError('')
              setLoading(true)
              setSelectedStatus(status.value)
              setPageNumber(1)
            }}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Search and dropdown filters */}
      <form
        className="enrollment-filters"
        onSubmit={handleSearch}
      >
        <input
          type="text"
          placeholder="Search by student name or number..."
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

        <select
          value={selectedCourse}
          onChange={(e) => {
            setError('')
            setLoading(true)
            setSelectedCourse(e.target.value)
            setPageNumber(1)
          }}
        >
          <option value="all">All courses</option>

          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>

        {isPresident && (
          <select
            value={selectedSchool}
            onChange={(e) => {
              setError('')
              setLoading(true)
              setSelectedSchool(e.target.value)
              setPageNumber(1)
            }}
          >
            <option value="all">All schools</option>

            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        )}
      </form>

      {/* Enrollments table */}
      <div className="enrollments-table-wrapper">
        <table className="enrollments-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Student Number</th>
              <th>Course</th>
              <th>Course Code</th>
              {isPresident && <th>School</th>}
              <th>Enrollment Date</th>
              <th>Decision Date</th>
              <th>Grade</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => {
                const course = courses.find(
                  (item) =>
                    Number(item.id) === Number(enrollment.courseId)
                )

                const school = schools.find(
                  (item) =>
                    Number(item.id) === Number(course?.schoolId)
                )

                return (
                  <tr key={enrollment.id}>
                    <td>{enrollment.studentName}</td>
                    <td>{enrollment.studentNumber}</td>
                    <td>{enrollment.courseName}</td>
                    <td>{enrollment.courseCode}</td>

                    {isPresident && (
                      <td>
                        {enrollment.schoolName ||
                          course?.schoolName ||
                          school?.name ||
                          '—'}
                      </td>
                    )}

                    <td>{formatDate(enrollment.enrollmentDate)}</td>
                    <td>{formatDate(enrollment.decisionDate)}</td>
                    <td>{enrollment.grade ?? '—'}</td>

                    <td>
                      <span
                        className={`enrollment-status enrollment-status-${Number(enrollment.status)}`}
                      >
                        {getStatusLabel(enrollment.status)}
                      </span>
                    </td>

                    <td>
                      <div className="enrollment-row-actions">
                        {Number(enrollment.status) === 1 && (
                          <>
                            <button
                              type="button"
                              className="enrollment-approve-button"
                              onClick={() =>
                                handleRequestAction(enrollment.id, 'approve')
                              }
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="enrollment-decline-button"
                              onClick={() =>
                                handleRequestAction(enrollment.id, 'decline')
                              }
                            >
                              Decline
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="enrollment-decline-button"
                          onClick={() => handleDeleteEnrollment(enrollment)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={isPresident ? 10 : 9}
                  className="table-empty"
                >
                  No enrollments found.
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
          {totalCount} enrollments
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
    </div>
  )
}

export default EnrollmentsPage
