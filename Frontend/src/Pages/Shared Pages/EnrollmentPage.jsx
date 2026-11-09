
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

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

function EnrollmentsPage() {
  const { user } = useAuth()
  const token = user?.token

  const isPresident =
    user?.role === 3 || user?.role === 'President'

  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [schools, setSchools] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedSchool, setSelectedSchool] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [saving, setSaving] = useState(false)

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setError('')

        const headers = getAuthHeaders(token)

        const requests = [
          fetch(`${API}/Enrollments`, { headers }),
          fetch(`${API}/Students`, { headers }),
          fetch(`${API}/Courses`, { headers }),
        ]

        if (isPresident) {
          requests.push(
            fetch(`${API}/Schools`, { headers })
          )
        }

        const responses = await Promise.all(requests)

        if (responses.some((response) => !response.ok)) {
          throw new Error('Failed to load enrollment data.')
        }

        const data = await Promise.all(
          responses.map((response) => response.json())
        )

        setEnrollments(data[0])
        setStudents(data[1])
        setCourses(data[2])

        if (isPresident) {
          setSchools(data[3])
        }
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadData()
    } 
  }, [token, isPresident])

  // Refresh enrollments
  async function refreshEnrollments() {
    const response = await fetch(`${API}/Enrollments`, {
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh enrollments.')
    }

    const data = await response.json()
    setEnrollments(data)
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

      await refreshEnrollments()

      setStudentId('')
      setCourseId('')
      setShowForm(false)
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

  // Filter enrollments
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
    all: enrollments.length,
    0: enrollments.filter((e) => Number(e.status) === 0).length,
    1: enrollments.filter((e) => Number(e.status) === 1).length,
    2: enrollments.filter((e) => Number(e.status) === 2).length,
    3: enrollments.filter((e) => Number(e.status) === 3).length,
    4: enrollments.filter((e) => Number(e.status) === 4).length,
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
                }}>
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
            onClick={() => setSelectedStatus(status.value)}
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
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
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
            onChange={(e) => setSelectedSchool(e.target.value)}
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
          {filteredEnrollments.length} enrollments
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
                      {Number(enrollment.status) === 1 ? (
                        <div className="enrollment-row-actions">
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
                        </div>
                      ) : (
                        '—'
                      )}
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
    </div>
  )
}

export default EnrollmentsPage
