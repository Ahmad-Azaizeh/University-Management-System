import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function StudentCoursesPage() {
  const { user } = useAuth()
  const token = user?.token

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    async function loadCourses() {
      try {
        const response = await fetch(`${API}/Students/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load your courses.')
        }

        const data = await response.json()
        setStudent(data)
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [token])

  if (loading) return <p>Loading your courses...</p>

  if (error) {
    return <p className="student-courses-error">{error}</p>
  }

  const courses = student?.enrollments || []

  return (
    <div className="student-courses-page">
      <div className="student-courses-header">
        <div>
          <h2>My Courses</h2>
          <p>View the courses you are currently enrolled in.</p>
        </div>

        <span className="student-courses-count">
          {courses.length} Courses
        </span>
      </div>

      <div className="student-courses-info">
        <div>
          <span>Student</span>
          <strong>{student?.fullName}</strong>
        </div>

        <div>
          <span>Student Number</span>
          <strong>{student?.studentNumber}</strong>
        </div>

        <div>
          <span>School</span>
          <strong>{student?.schoolName}</strong>
        </div>
      </div>

      <div className="student-courses-grid">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div
              className="student-course-card"
              key={course.enrollmentId}
            >
              <div className="student-course-card-top">
                <span className="student-course-code">
                  {course.courseCode}
                </span>

                <span className={`enrollment-status enrollment-status-${Number(course.status)}`}>
                  {{
                    0: 'Approved',
                    1: 'Pending',
                    2: 'Declined',
                    3: 'Completed',
                    4: 'Failed',
                  }[Number(course.status)] ?? 'Unknown'}
                </span>
              </div>

              <h3>{course.courseName}</h3>

               <div className="student-course-card-footer">
                  <span>Professor</span>
                  <p>{course.professorName || 'Not assigned'}</p>
                </div>
            </div>
          ))
        ) : (
          <div className="student-courses-empty">
            You are not enrolled in any courses yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentCoursesPage