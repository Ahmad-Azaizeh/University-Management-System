
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function StudentDashboard() {
  const { user } = useAuth()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(`${API}/Students/me`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load your dashboard.')
        }

        const data = await response.json()
        setStudent(data)
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  if (loading) return <p>Loading your dashboard...</p>

  if (error) {
    return <p className="student-dashboard-error">{error}</p>
  }

  if (!student) return null

  const enrollments = student.enrollments || []

  const gradedEnrollments = enrollments.filter(
    (enrollment) => enrollment.grade !== null
  )

  const averageGrade = gradedEnrollments.length
    ? (
        gradedEnrollments.reduce(
          (total, enrollment) => total + Number(enrollment.grade),
          0
        ) / gradedEnrollments.length
      ).toFixed(2)
    : 'N/A'

  return (
    <div className="student-dashboard">
      <div className="student-dashboard-header">
        <div>
          <h2>Welcome, {student.fullName}</h2>
          <p>Here's an overview of your academic performance.</p>
        </div>
      </div>

      <div className="student-dashboard-profile">
        <div>
          <span>Student Number</span>
          <strong>{student.studentNumber}</strong>
        </div>

        <div>
          <span>School</span>
          <strong>{student.schoolName}</strong>
        </div>
      </div>

      <div className="student-dashboard-stats">
        <div className="student-stat-card">
          <span>Enrolled Courses</span>
          <strong>{enrollments.length}</strong>
        </div>

        <div className="student-stat-card">
          <span>Graded Courses</span>
          <strong>{gradedEnrollments.length}</strong>
        </div>

        <div className="student-stat-card">
          <span>Average Grade</span>
          <strong>
            {averageGrade === 'N/A' ? averageGrade : `${averageGrade}%`}
          </strong>
        </div>
      </div>

      <div className="student-dashboard-courses">
        <div className="student-dashboard-section-header">
          <h3>My Courses</h3>
          <span>{enrollments.length} courses</span>
        </div>

        <div className="student-dashboard-table-wrapper">
          <table className="student-dashboard-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Course Code</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.enrollmentId}>
                    <td>{enrollment.courseName}</td>
                    <td>{enrollment.courseCode}</td>
                    <td>
                      {enrollment.grade === null
                        ? 'Not graded'
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
                          ? 'Pending'
                          : 'Graded'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    You are not enrolled in any courses yet.
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

export default StudentDashboard
