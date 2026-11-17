
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'
const PAGE_SIZE = 10

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
  try {
    const errorData = await response.json()
    return errorData.message || fallback
  } catch {
    return fallback
  }
}

async function fetchEnrollmentData({
  token,
  pageNumber,
  search,
  selectedStatus,
  selectedCourse,
  selectedSchool,
  isPresident,
  signal,
}) {
  const hasFilters =
    search.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCourse !== 'all' ||
    (isPresident && selectedSchool !== 'all')

  const endpoint = hasFilters
    ? `${API}/Enrollments?paginated=false`
    : `${API}/Enrollments?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`

  const response = await fetch(endpoint, {
    headers: getAuthHeaders(token),
    signal,
  })

  if (!response.ok) {
    throw new Error('Failed to load enrollments.')
  }

  const data = await response.json()

  if (hasFilters) {
    return {
      items: data,
      totalCount: data.length,
      totalPages: 1,
    }
  }

  return {
    items: data.items,
    totalCount: data.totalCount,
    totalPages: data.totalPages,
  }
}

function EnrollmentsPage() {
  const { user } = useAuth()
  const token = user?.token

  const isPresident =
    user?.role === 3 || user?.role === 'President'

  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [schools, setSchools] = useState([])

  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedSchool, setSelectedSchool] = useState('all')

  const [pageNumber, setPageNumber] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [saving, setSaving] = useState(false)

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  const hasFilters =
    search.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCourse !== 'all' ||
    (isPresident && selectedSchool !== 'all')

  // Load reference data
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadReferenceData() {
      try {
        const headers = getAuthHeaders(token)

        const requests = [
          fetch(`${API}/Students?paginated=false`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API}/Courses?paginated=false`, {
            headers,
            signal: controller.signal,
          }),
        ]

        if (isPresident) {
          requests.push(
            fetch(`${API}/Schools`, {
              headers,
              signal: controller.signal,
            })
          )
        }

        const responses = await Promise.all(requests)

        if (responses.some((response) => !response.ok)) {
          throw new Error('Failed to load enrollment data.')
        }

        const data = await Promise.all(
          responses.map((response) => response.json())
        )

        setStudents(data[0])
        setCourses(data[1])

        if (isPresident) {
          setSchools(data[2])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong.')
          setLoading(false)
        }
      }
    }

    loadReferenceData()

    return () => controller.abort()
  }, [token, isPresident])

  // Fetch enrollments according to search and filters
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadEnrollments() {
      try {
        const data = await fetchEnrollmentData({
          token,
          pageNumber,
          search,
          selectedStatus,
          selectedCourse,
          selectedSchool,
          isPresident,
          signal: controller.signal,
        })

        setEnrollments(data.items)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
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
    search,
    selectedStatus,
    selectedCourse,
    selectedSchool,
    isPresident,
  ])

  // Refresh enrollments after an action
  async function refreshEnrollments(targetPage = pageNumber) {
    const data = await fetchEnrollmentData({
      token,
      pageNumber: targetPage,
      search,
      selectedStatus,
      selectedCourse,
      selectedSchool,
      isPresident,
    })

    setEnrollments(data.items)
    setTotalCount(data.totalCount)
    setTotalPages(data.totalPages)
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
          await getErrorMessage(response, 'Failed to create enrollment.')
        )
      }

      setStudentId('')
      setCourseId('')
      setSelectedStudent(null)
      setStudentSearch('')
      setShowForm(false)

      setPageNumber(1)
      await refreshEnrollments(1)
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
          await getErrorMessage(response, `Failed to ${action} request.`)
        )
      }

      await refreshEnrollments()
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
    }
  }

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
          await getErrorMessage(response, 'Failed to delete enrollment.')
        )
      }

      await refreshEnrollments()
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
    }
  }

  // Apply search and filters to the loaded enrollment records
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesStatus =
      selectedStatus === 'all' ||
      Number(enrollment.status) === Number(selectedStatus)

    const searchValue = search.toLowerCase()

    const matchesSearch = [
      enrollment.studentName,
      enrollment.studentNumber,
      enrollment.courseName,
      enrollment.courseCode,
    ].some((value) =>
      value?.toLowerCase().includes(searchValue)
    )

    const matchesCourse =
      selectedCourse === 'all' ||
      Number(enrollment.courseId) === Number(selectedCourse)

    const course = courses.find(
      (item) => Number(item.id) === Number(enrollment.courseId)
    )

    const matchesSchool =
      !isPresident ||
      selectedSchool === 'all' ||
      Number(course?.schoolId) === Number(selectedSchool)

    return (
      matchesStatus &&
      matchesSearch &&
      matchesCourse &&
      matchesSchool
    )
  })

  // Count enrollments by status
  const statusCounts = {
    all: hasFilters ? enrollments.length : totalCount,
    0: enrollments.filter((e) => Number(e.status) === 0).length,
    1: enrollments.filter((e) => Number(e.status) === 1).length,
    2: enrollments.filter((e) => Number(e.status) === 2).length,
    3: enrollments.filter((e) => Number(e.status) === 3).length,
    4: enrollments.filter((e) => Number(e.status) === 4).length,
  }

  function goToPreviousPage() {
    setPageNumber((previous) => Math.max(previous - 1, 1))
  }

  function goToNextPage() {
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

  const filteredStudents = students
    .filter((student) => {
      const searchValue = studentSearch.toLowerCase()

      return (
        student.fullName?.toLowerCase().includes(searchValue) ||
        student.studentNumber?.toLowerCase().includes(searchValue)
      )
    })
    .slice(0, 10)

  return (
    <div className="dashboard-content enrollments-page">
      <div className="enrollments-page-header">
        <div>
          <h2>Enrollments</h2>
          <p>Manage student course enrollments and requests.</p>
        </div>

        <button
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
            <label>Student</label>

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
                  }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by student name or number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />

                {studentSearch.trim() && (
                  <div className="enrollment-student-results">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <button
                          type="button"
                          key={student.id}
                          onClick={() => {
                            setSelectedStudent(student)
                            setStudentId(String(student.id))
                            setStudentSearch('')
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
            <label>Course</label>
            <select
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
            key={String(status.value)}
            className={
              selectedStatus === status.value
                ? 'enrollment-filter active'
                : 'enrollment-filter'
            }
            onClick={() => {
              setSelectedStatus(status.value)
              setPageNumber(1)
            }}
          >
            {status.label}
            <span>{statusCounts[status.value]}</span>
          </button>
        ))}
      </div>

      {/* Search and dropdown filters */}
      <div className="enrollment-filters">
        <input
          type="text"
          placeholder="Search by student or course..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPageNumber(1)
          }}
        />

        <select
          value={selectedCourse}
          onChange={(e) => {
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

        <span className="enrollment-count">
          {hasFilters ? filteredEnrollments.length : totalCount} enrollments
        </span>
      </div>

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
            {filteredEnrollments.length > 0 ? (
              filteredEnrollments.map((enrollment) => {
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
                      <td>{school?.name ?? '—'}</td>
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
                              className="enrollment-approve-button"
                              onClick={() =>
                                handleRequestAction(enrollment.id, 'approve')
                              }
                            >
                              Approve
                            </button>

                            <button
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

      {!hasFilters && totalPages > 1 && (
        <div className="students-pagination">
          <button
            className="students-pagination-button"
            onClick={goToPreviousPage}
            disabled={pageNumber === 1}
          >
            Previous
          </button>

          <span className="students-page-info">
            Page {pageNumber} of {totalPages}
          </span>

          <button
            className="students-pagination-button"
            onClick={goToNextPage}
            disabled={pageNumber === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default EnrollmentsPage
