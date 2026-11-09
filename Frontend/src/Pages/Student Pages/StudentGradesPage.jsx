
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function StudentGradesPage() {
  const { user } = useAuth()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGrades() {
      try {
        const response = await fetch(`${API}/Students/me`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load your grades.')
        }

        const data = await response.json()
        setStudent(data)
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    loadGrades()
  }, [user.token])

  if (loading) return <p>Loading your grades...</p>

  if (error) {
    return <p className="student-grades-error">{error}</p>
  }

  const enrollments = student?.enrollments || []

  const gradedCourses = enrollments.filter(
    (enrollment) => enrollment.grade !== null
  )

  const pendingCourses = enrollments.length - gradedCourses.length

  const average =
    gradedCourses.length > 0
      ? gradedCourses.reduce(
          (total, enrollment) => total + Number(enrollment.grade),
          0
        ) / gradedCourses.length
      : null

  return (
    <div className="student-grades-page">
      <div className="student-grades-header">
        <div>
          <h2>My Grades</h2>
          <p>Review your academic results and pending grades.</p>
        </div>
      </div>

      <div className="student-grades-summary">
        <div className="student-grade-stat">
          <span>Total Courses</span>
          <strong>{enrollments.length}</strong>
        </div>

        <div className="student-grade-stat">
          <span>Graded Courses</span>
          <strong>{gradedCourses.length}</strong>
        </div>

        <div className="student-grade-stat">
          <span>Pending Grades</span>
          <strong>{pendingCourses}</strong>
        </div>

        <div className="student-grade-stat">
          <span>Average Grade</span>
          <strong>
            {average === null ? '—' : `${average.toFixed(2)}%`}
          </strong>
        </div>
      </div>

      <div className="student-grades-table-section">
        <div className="student-grades-section-header">
          <div>
            <h3>Course Results</h3>
            <p>Your grades for enrolled courses.</p>
          </div>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.enrollmentId}>
                    <td>{enrollment.courseCode}</td>
                    <td>{enrollment.courseName}</td>
                    <td>
                      {enrollment.grade === null
                        ? '—'
                        : `${enrollment.grade}%`}
                    </td>
                    <td>
                      <span
                        className={
                          enrollment.grade === null
                            ? 'student-grade-pending'
                            : 'student-grade-completed'
                        }
                      >
                        {enrollment.grade === null
                          ? 'Not Graded'
                          : 'Graded'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    No enrolled courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StudentGradesPage
