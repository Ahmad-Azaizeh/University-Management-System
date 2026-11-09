
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function StudentCoursesPage() {
  const { user } = useAuth()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch(`${API}/Students/me`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
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
  }, [user])

  if (loading) return <p>Loading your courses...</p>

  if (error) {
    return <p className="student-courses-error">{error}</p>
  }

  const courses = student?.enrollments || []

  const filteredCourses = courses.filter((course) => {
    const value = search.toLowerCase()

    return (
      course.courseName?.toLowerCase().includes(value) ||
      course.courseCode?.toLowerCase().includes(value)
    )
  })

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

      <div className="student-courses-toolbar">
        <input
          type="text"
          placeholder="Search courses by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <span>{filteredCourses.length} results</span>
      </div>

      <div className="student-courses-grid">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div
              className="student-course-card"
              key={course.enrollmentId}
            >
              <div className="student-course-card-top">
                <span className="student-course-code">
                  {course.courseCode}
                </span>

                <span
                  className={
                    course.grade === null
                      ? 'student-course-pending'
                      : 'student-course-graded'
                  }
                >
                  {course.grade === null ? 'Pending' : 'Graded'}
                </span>
              </div>

              <h3>{course.courseName}</h3>

              <div className="student-course-card-footer">
                <span>Current Grade</span>

                <strong>
                  {course.grade === null
                    ? 'Not graded'
                    : `${course.grade}%`}
                </strong>
              </div>
            </div>
          ))
        ) : (
          <div className="student-courses-empty">
            {courses.length === 0
              ? 'You are not enrolled in any courses yet.'
              : 'No courses match your search.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentCoursesPage
