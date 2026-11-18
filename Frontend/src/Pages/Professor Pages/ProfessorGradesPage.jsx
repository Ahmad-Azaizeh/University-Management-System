
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'
const LOOKUP_PAGE_SIZE = 100

function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

async function fetchAllPages(endpoint, token, signal) {
  let allItems = []
  let currentPage = 1

  while (true) {
    const params = new URLSearchParams({
      pageNumber: String(currentPage),
      pageSize: String(LOOKUP_PAGE_SIZE),
    })

    const response = await fetch(`${API}/${endpoint}?${params}`, {
      headers: getAuthHeaders(token),
      signal,
    })

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

function formatDate(date) {
  if (!date) return '—'

  return new Date(date).toLocaleDateString()
}

function ProfessorGradesPage() {
  const { user } = useAuth()
  const token = user?.token

  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState({})

  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [savingId, setSavingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load professor's assigned courses
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadCourses() {
      try {
        const data = await fetchAllPages(
          'Courses',
          token,
          controller.signal
        )

        setCourses(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCourses(false)
        }
      }
    }

    loadCourses()

    return () => controller.abort()
  }, [token])

  // Load students when a course is selected
  useEffect(() => {
    if (!selectedCourseId || !token) return

    const controller = new AbortController()

    async function loadStudents() {
      try {
        const response = await fetch(
          `${API}/Enrollments/course/${selectedCourseId}/students`,
          {
            headers: getAuthHeaders(token),
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error('Failed to load students.')
        }

        const data = await response.json()
        setStudents(data)

        const initialGrades = {}

        data.forEach((student) => {
          initialGrades[student.enrollmentId] =
            student.grade === null ? '' : student.grade
        })

        setGrades(initialGrades)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStudents(false)
        }
      }
    }

    loadStudents()

    return () => controller.abort()
  }, [selectedCourseId, token])

  // Update local grade input
  function handleGradeChange(enrollmentId, value) {
    setGrades((previous) => ({
      ...previous,
      [enrollmentId]: value,
    }))

    setSuccess('')
    setError('')
  }

  // Save grade
  async function handleSaveGrade(enrollmentId) {
    const gradeValue = grades[enrollmentId]

    if (
      gradeValue !== '' &&
      (Number(gradeValue) < 0 || Number(gradeValue) > 100)
    ) {
      setError('Grade must be between 0 and 100.')
      return
    }

    try {
      setSavingId(enrollmentId)
      setError('')
      setSuccess('')

      const response = await fetch(
        `${API}/Enrollments/${enrollmentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(token),
          },
          body: JSON.stringify({
            grade: gradeValue === '' ? null : Number(gradeValue),
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        throw new Error(
          errorData.message || 'Failed to save grade.'
        )
      }

      // Reload students to get updated status and dates
      const refreshResponse = await fetch(
        `${API}/Enrollments/course/${selectedCourseId}/students`,
        {
          headers: getAuthHeaders(token),
        }
      )

      if (!refreshResponse.ok) {
        throw new Error('Grade saved, but failed to refresh student data.')
      }

      const data = await refreshResponse.json()
      setStudents(data)

      const updatedGrades = {}

      data.forEach((student) => {
        updatedGrades[student.enrollmentId] =
          student.grade === null ? '' : student.grade
      })

      setGrades(updatedGrades)
      setSuccess('Grade saved successfully.')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSavingId(null)
    }
  }

  if (loadingCourses) {
    return <p>Loading courses...</p>
  }

  return (
    <div className="professor-grades-page">
      <div className="professor-grades-header">
        <div>
          <h2>Grades</h2>
          <p>View your courses and manage student grades.</p>
        </div>
      </div>

      <div className="professor-grades-course-selector">
        <label htmlFor="courseSelect">Select Course</label>

        <select
          id="courseSelect"
          value={selectedCourseId}
          onChange={(e) => {
            const value = e.target.value

            setSelectedCourseId(value)
            setStudents([])
            setGrades({})
            setLoadingStudents(Boolean(value))
            setError('')
            setSuccess('')
          }}
        >
          <option value="">Choose a course</option>

          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="professor-grades-error">{error}</p>
      )}

      {success && (
        <p className="professor-grades-success">{success}</p>
      )}

      {!selectedCourseId && (
        <div className="professor-grades-empty">
          Select a course to view its enrolled students.
        </div>
      )}

      {selectedCourseId && loadingStudents && (
        <p>Loading students...</p>
      )}

      {selectedCourseId && !loadingStudents && (
        <div className="professor-grades-table-wrapper">
          <table className="professor-grades-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student Number</th>
                <th>Enrollment Date</th>
                <th>Completion Date</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.enrollmentId}>
                    <td>{student.fullName}</td>
                    <td>{student.studentNumber}</td>

                    <td>{formatDate(student.enrollmentDate)}</td>
                    <td>{formatDate(student.completedAt)}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={grades[student.enrollmentId] ?? ''}
                        onChange={(e) =>
                          handleGradeChange(
                            student.enrollmentId,
                            e.target.value
                          )
                        }
                        placeholder="Not graded"
                      />
                    </td>

                    <td>
                      <span className={`enrollment-status enrollment-status-${Number(student.status)}`}>
                        {{
                          0: 'Approved',
                          3: 'Completed',
                          4: 'Failed',
                        }[Number(student.status)] ?? 'Unknown'}
                      </span>
                    </td>

                    <td>
                      <button
                        className="professor-grade-save-button"
                        onClick={() =>
                          handleSaveGrade(student.enrollmentId)
                        }
                        disabled={savingId === student.enrollmentId}
                      >
                        {savingId === student.enrollmentId
                          ? 'Saving...'
                          : 'Save Grade'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    No students are enrolled in this course.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ProfessorGradesPage
