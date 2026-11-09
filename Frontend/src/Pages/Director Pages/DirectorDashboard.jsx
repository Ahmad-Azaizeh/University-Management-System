
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function DirectorDashboard() {
  const { user } = useAuth()

  const [students, setStudents] = useState([])
  const [professors, setProfessors] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const headers = {
          Authorization: `Bearer ${user.token}`,
        }

        const [studentsResponse, professorsResponse, coursesResponse, enrollmentsResponse] =
          await Promise.all([
            fetch(`${API}/Students`, { headers }),
            fetch(`${API}/Professors`, { headers }),
            fetch(`${API}/Courses`, { headers }),
            fetch(`${API}/Enrollments`, { headers }),
          ])

        if (
          !studentsResponse.ok ||
          !professorsResponse.ok ||
          !coursesResponse.ok ||
          !enrollmentsResponse.ok
        ) {
          throw new Error('Failed to load dashboard data.')
        }

        const [studentsData, professorsData, coursesData, enrollmentsData] =
          await Promise.all([
            studentsResponse.json(),
            professorsResponse.json(),
            coursesResponse.json(),
            enrollmentsResponse.json(),
          ])

        setStudents(studentsData)
        setProfessors(professorsData)
        setCourses(coursesData)
        setEnrollments(enrollmentsData)
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    if (user?.token) {
      loadDashboard()
    }
  }, [user])

  if (loading) return <p>Loading dashboard...</p>

  if (error) {
    return <p className="error-message">{error}</p>
  }

  const totalEnrollments = enrollments.length

  const ungradedEnrollments = enrollments.filter(
    (enrollment) => enrollment.grade === null
  ).length

  const gradedEnrollments = enrollments.filter(
    (enrollment) => enrollment.grade !== null
  )

  const averageGrade =
    gradedEnrollments.length > 0
      ? (
          gradedEnrollments.reduce(
            (total, enrollment) => total + Number(enrollment.grade),
            0
          ) / gradedEnrollments.length
        ).toFixed(2)
      : 'N/A'

  function getCourseStats(courseId) {
    const courseEnrollments = enrollments.filter(
      (enrollment) => enrollment.courseId === courseId
    )

    const graded = courseEnrollments.filter(
      (enrollment) => enrollment.grade !== null
    )

    const average =
      graded.length > 0
        ? (
            graded.reduce(
              (total, enrollment) => total + Number(enrollment.grade),
              0
            ) / graded.length
          ).toFixed(2)
        : 'N/A'

    return {
      studentCount: courseEnrollments.length,
      ungradedCount: courseEnrollments.filter(
        (enrollment) => enrollment.grade === null
      ).length,
      average,
    }
  }

  return (
    <section className="director-dashboard">
      <header className="director-dashboard-header">
        <h2>School Overview</h2>
        <p>Statistics and academic performance of your school.</p>
      </header>

      <div className="director-stats-grid">
        <div className="director-stat-card">
          <p>Total Students</p>
          <h3>{students.length}</h3>
        </div>

        <div className="director-stat-card">
          <p>Total Professors</p>
          <h3>{professors.length}</h3>
        </div>

        <div className="director-stat-card">
          <p>Total Courses</p>
          <h3>{courses.length}</h3>
        </div>

        <div className="director-stat-card">
          <p>Total Enrollments</p>
          <h3>{totalEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Ungraded Enrollments</p>
          <h3>{ungradedEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Average Grade</p>
          <h3>{averageGrade}</h3>
        </div>
      </div>

      <div className="director-dashboard-courses">
        <h3>Course Overview</h3>

        <div className="director-dashboard-table-wrapper">
          <table className="director-dashboard-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Professor</th>
                <th>Students</th>
                <th>Ungraded</th>
                <th>Average Grade</th>
              </tr>
            </thead>

            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="5">No courses found.</td>
                </tr>
              ) : (
                courses.map((course) => {
                  const stats = getCourseStats(course.id)

                  return (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.name}</strong>
                        <span>{course.code}</span>
                      </td>
                      <td>{course.professorName || 'Not assigned'}</td>
                      <td>{stats.studentCount}</td>
                      <td>{stats.ungradedCount}</td>
                      <td>{stats.average}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default DirectorDashboard
