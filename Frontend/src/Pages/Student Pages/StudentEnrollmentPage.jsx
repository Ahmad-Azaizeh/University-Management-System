
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

const PAGE_SIZE = 10
const COURSE_PAGE_SIZE = 100

const enrollmentStatuses = {
  0: 'Approved',
  1: 'Pending',
  2: 'Declined',
  3: 'Completed',
  4: 'Failed',
}

function formatDate(date) {
  if (!date) return '—'

  return new Date(date).toLocaleDateString()
}

async function fetchAllPages(endpoint, token) {
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  let allItems = []
  let pageNumber = 1
  let totalPages

  do {
    const response = await fetch(
      `${API}/${endpoint}?pageNumber=${pageNumber}&pageSize=${COURSE_PAGE_SIZE}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error('Failed to load available courses.')
    }

    const data = await response.json()

    allItems = [...allItems, ...data.items]
    totalPages = data.totalPages
    pageNumber++
  } while (pageNumber <= totalPages)

  return allItems
}

async function fetchMyEnrollments(token, pageNumber, searchTerm) {
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(PAGE_SIZE),
  })

  if (searchTerm.trim()) {
    params.set('searchTerm', searchTerm.trim())
  }

  const response = await fetch(
    `${API}/Enrollments/me?${params.toString()}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error('Failed to load your enrollments.')
  }

  return await response.json()
}

function StudentEnrollmentsPage() {
  const { user } = useAuth()
  const token = user?.token

  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])

  const [selectedCourseId, setSelectedCourseId] = useState('')

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load all available courses
  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function loadCourses() {
      try {
        const data = await fetchAllPages('Courses', token)

        if (!cancelled) {
          setCourses(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load courses.')
        }
      }
    }

    loadCourses()

    return () => {
      cancelled = true
    }
  }, [token])

  // Load paginated enrollment history
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadEnrollments() {
      try {
        setLoading(true)

        const data = await fetchMyEnrollments(
          token,
          pageNumber,
          appliedSearch
        )

        if (controller.signal.aborted) return

        setEnrollments(data.items)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Failed to load your enrollments.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadEnrollments()

    return () => {
      controller.abort()
    }
  }, [token, pageNumber, appliedSearch])

  // Refresh enrollment history after a request
  async function refreshEnrollments() {
    const data = await fetchMyEnrollments(
      token,
      pageNumber,
      appliedSearch
    )

    setEnrollments(data.items)
    setTotalCount(data.totalCount)
    setTotalPages(data.totalPages)
  }

  // Active enrollments on the current page only
  const activeEnrollments = enrollments.filter(
    (enrollment) =>
      Number(enrollment.status) === 0 ||
      Number(enrollment.status) === 1
  )

  // Submit search
  function handleSearch(e) {
    e.preventDefault()

    setPageNumber(1)
    setAppliedSearch(search.trim())
  }

  // Clear search
  function handleClearSearch() {
    setSearch('')
    setAppliedSearch('')
    setPageNumber(1)
  }

  // Request enrollment
  async function handleRequestEnrollment() {
    if (!selectedCourseId) {
      setError('Please select a course.')
      return
    }

    try {
      setRequesting(true)
      setError('')
      setSuccess('')

      const response = await fetch(`${API}/Enrollments/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: Number(selectedCourseId),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        throw new Error(
          errorData.message ||
          errorData.title ||
          errorData.detail ||
          'Failed to submit enrollment request.'
        )
      }

      setSelectedCourseId('')
      setSuccess('Enrollment request submitted successfully.')

      // Reset search and return to the first page
      const shouldReset =
        pageNumber !== 1 || appliedSearch !== ''

      setSearch('')
      setAppliedSearch('')
      setPageNumber(1)

      // If already on the first unfiltered page, refresh manually
      if (!shouldReset) {
        await refreshEnrollments()
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <section className="dashboard-content students-page">
        <p>Loading your enrollments...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">

      {/* Header */}
      <div className="students-page-header">
        <div>
          <h2>My Enrollments</h2>
          <p>Request courses and manage your enrollment history.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="students-header-actions">
        <span className="students-count">
           {activeEnrollments.length} Active Enrollments
        </span>
      </div>

      {/* Course Request */}
      <div className="student-enrollments-request">
        <h3>Request Course Enrollment</h3>

        <p>
          Select a course to submit an enrollment request.
        </p>

        <p className="myclass">
          Your request will be reviewed by your Director.
        </p>

        <div className="students-header-actions">
          <select
            className="students-search"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value)
              setError('')
              setSuccess('')
            }}
          >
            <option value="">Select a course</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>

          <button
            className="students-add-button"
            onClick={handleRequestEnrollment}
            disabled={requesting || !selectedCourseId}
          >
            {requesting ? 'Submitting...' : 'Request Enrollment'}
          </button>
        </div>
      </div>

      {error && (
        <p className="students-error">{error}</p>
      )}

      {success && (
        <p className="student-enrollments-success">{success}</p>
      )}

      {/* Enrollment History */}
      <div className="students-page-header">
        <div>
          <h3>Enrollment History</h3>
          <p>View your requests, decisions, and completed courses.</p>
        </div>
      </div>

      {/* Search */}
      <form
        className="students-header-actions"
        onSubmit={handleSearch}
      >
        <input
          className="students-search"
          type="text"
          placeholder="Search by course name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="students-add-button"
          type="submit"
        >
          Search
        </button>

        <button
          className="students-pagination-button"
          type="button"
          onClick={handleClearSearch}
          
        >
          Clear
        </button>
      </form>

      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Course</th>
              <th>Course Code</th>
              <th>Enrollment Date</th>
              <th>Decision Date</th>
              <th>Completion Date</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>#{enrollment.id}</td>
                  <td>{enrollment.courseName}</td>
                  <td>{enrollment.courseCode}</td>

                  <td>{formatDate(enrollment.enrollmentDate)}</td>
                  <td>{formatDate(enrollment.decisionDate)}</td>
                  <td>{formatDate(enrollment.completedAt)}</td>

                  <td>
                    {enrollment.grade === null
                      ? '—'
                      : `${enrollment.grade}%`}
                  </td>

                  <td>
                    <span
                      className={`enrollment-status enrollment-status-${Number(enrollment.status)}`}
                    >
                      {enrollmentStatuses[Number(enrollment.status)] ?? 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  {totalCount === 0
                    ? appliedSearch
                      ? 'No matching enrollments found.'
                      : 'You have no enrollment records yet.'
                    : 'No enrollments found on this page.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="students-pagination">
        <button
          className="students-pagination-button"
          onClick={() => setPageNumber((prev) => prev - 1)}
          disabled={pageNumber <= 1}
        >
          Previous
        </button>

        <span className="students-page-info">
          Page {pageNumber} of {totalPages}
        </span>

        <button
          className="students-pagination-button"
          onClick={() => setPageNumber((prev) => prev + 1)}
          disabled={pageNumber >= totalPages}
        >
          Next
        </button>
      </div>

    </section>
  )
}

export default StudentEnrollmentsPage
