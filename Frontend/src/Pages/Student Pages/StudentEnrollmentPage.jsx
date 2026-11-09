
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

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

function StudentEnrollmentsPage() {
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  

  // Load available courses and enrollment history
  useEffect(() => {
    async function loadData() {
      const headers = {
    Authorization: `Bearer ${user.token}`,
  }
      try {
        const [coursesResponse, enrollmentsResponse] =
          await Promise.all([
            fetch(`${API}/Courses`, { headers }),
            fetch(`${API}/Enrollments/me`, { headers }),
          ])

        if (!coursesResponse.ok) {
          throw new Error('Failed to load available courses.')
        }

        if (!enrollmentsResponse.ok) {
          throw new Error('Failed to load your enrollments.')
        }

        const coursesData = await coursesResponse.json()
        const enrollmentsData = await enrollmentsResponse.json()

        setCourses(coursesData)
        setEnrollments(enrollmentsData)
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    if (user?.token) {
      loadData()
    }
  }, [user?.token])

  // Refresh enrollment history
  async function refreshEnrollments() {
    const headers = {
    Authorization: `Bearer ${user.token}`,
    }
    
    const response = await fetch(`${API}/Enrollments/me`, {
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to refresh your enrollments.')
    }

    const data = await response.json()
    setEnrollments(data)
  }

  // Request enrollment
  async function handleRequestEnrollment() {
    const headers = {
    Authorization: `Bearer ${user.token}`,
    }

    if (!selectedCourseId) {
      setError('Please select a course.')
      return
    }

    if (activeEnrollments.length >= 5) {
      setError('You cannot have more than five active enrollments.')
      return
    }

    const existingEnrollment = enrollments.find(
      (enrollment) =>
        enrollment.courseId === Number(selectedCourseId) &&
        [0, 1, 3].includes(Number(enrollment.status))
    )

    if (existingEnrollment) {
      setError(
        'You already have an enrollment record for this course.'
      )
      return
    }

    try {
      setRequesting(true)
      setError('')
      setSuccess('')

      const response = await fetch(`${API}/Enrollments/request`, {
        method: 'POST',
        headers: {
          ...headers,
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

      await refreshEnrollments()

      setSelectedCourseId('')
      setSuccess('Enrollment request submitted successfully.')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setRequesting(false)
    }
  }

  // Enrollment counts
  const activeEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.status === 0 || enrollment.status === 1
  )

  // Search enrollment history
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const value = search.toLowerCase()

    return (
      enrollment.courseName?.toLowerCase().includes(value) ||
      enrollment.courseCode?.toLowerCase().includes(value) ||
      String(enrollment.id).includes(value)
    )
  })

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

        <span className="students-count">
          {enrollments.length} Enrollments
        </span>
      </div>

      {/* Summary */}
      <div className="students-header-actions">
        <span className="students-count">
          Active: {activeEnrollments.length}/5
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
            disabled={activeEnrollments.length >= 5}>
            <option value="">Select a course</option>

            {courses
              .filter(
                (course) =>
                  !enrollments.some(
                    (enrollment) =>
                      Number(enrollment.courseId) === Number(course.id) &&
                      [0, 1, 3].includes(Number(enrollment.status))
                  )
              )
              .map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
          </select>

          <button
            className="students-add-button"
            onClick={handleRequestEnrollment}
            disabled={
              requesting ||
              !selectedCourseId ||
              activeEnrollments.length >= 5
            }>
            {requesting ? 'Submitting...' : 'Request Enrollment' }
          </button>
        </div>

        {activeEnrollments.length >= 5 && (
          <p>
            You have reached the maximum of five active enrollments.
          </p>
        )}
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

      <input
        className="students-search"
        type="text"
        placeholder="Search by course, code, or enrollment ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
            {filteredEnrollments.length > 0 ? (
              filteredEnrollments.map((enrollment) => (
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
                    <span className={`enrollment-status enrollment-status-${Number(enrollment.status)}`}>
                      {enrollmentStatuses[enrollment.status] ?? 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  {enrollments.length === 0
                    ? 'You have no enrollment records yet.'
                    : 'No matching enrollments found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </section>
  )
}

export default StudentEnrollmentsPage
