
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const API = 'https://localhost:7245/api'

function ProfessorDashboard() {
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [courseStudents, setCourseStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        // Load professor's assigned courses
        const coursesResponse = await fetch(`${API}/Courses`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!coursesResponse.ok) {
          throw new Error('Failed to load courses.')
        }

        const coursesData = await coursesResponse.json()
        setCourses(coursesData)

        // Load students for each course
        const studentsData = await Promise.all(
          coursesData.map(async (course) => {
            const response = await fetch(
              `${API}/Enrollments/course/${course.id}/students`,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                },
              }
            )

            if (!response.ok) {
              throw new Error(`Failed to load students for ${course.name}.`)
            }

            const students = await response.json()

            return {
              course,
              students,
            }
          })
        )

        setCourseStudents(studentsData)
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    if (user?.token) {
      loadDashboard()
    }
  }, [user?.token])

  if (loading) {
    return <section className="dashboard-content">Loading dashboard...</section>
  }

  if (error) {
    return <section className="dashboard-content">{error}</section>
  }

  // Calculate overall statistics
  const allEnrollments = courseStudents.flatMap(
    (item) => item.students
  )

  const uniqueStudents = new Set(
    allEnrollments.map((student) => student.studentNumber)
  )

  const ungradedEnrollments = allEnrollments.filter(
    (student) => student.grade === null
  )

  const gradedEnrollments = allEnrollments.filter(
    (student) => student.grade !== null
  )

  const averageGrade = gradedEnrollments.length > 0
    ? (
        gradedEnrollments.reduce(
          (total, student) => total + Number(student.grade),
          0
        ) / gradedEnrollments.length
      ).toFixed(2)
    : 'N/A'

  return (
    <section className="dashboard-content professor-dashboard">
      <div className="professor-dashboard-header">
        <div>
          <h2>Academic Overview</h2>
          <p>Overview of your courses and student performance.</p>
        </div>
      </div>

      <div className="professor-stats-grid">
        <div className="professor-stat-card">
          <p>Assigned Courses</p>
          <h3>{courses.length}</h3>
        </div>

        <div className="professor-stat-card">
          <p>Total Students</p>
          <h3>{uniqueStudents.size}</h3>
        </div>

        <div className="professor-stat-card">
          <p>Ungraded Enrollments</p>
          <h3>{ungradedEnrollments.length}</h3>
        </div>

        <div className="professor-stat-card">
          <p>Average Grade</p>
          <h3>{averageGrade}</h3>
        </div>
      </div>

      <div className="professor-dashboard-courses">
        <h3>Course Overview</h3>

        <div className="professor-dashboard-table-wrapper">
          <table className="professor-dashboard-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Students</th>
                <th>Ungraded</th>
                <th>Average Grade</th>
              </tr>
            </thead>

            <tbody>
              {courseStudents.length > 0 ? (
                courseStudents.map(({ course, students }) => {
                  const graded = students.filter(
                    (student) => student.grade !== null
                  )

                  const average = graded.length > 0
                    ? (
                        graded.reduce(
                          (total, student) => total + Number(student.grade),
                          0
                        ) / graded.length
                      ).toFixed(2)
                    : 'N/A'

                  const ungraded = students.filter(
                    (student) => student.grade === null
                  ).length

                  return (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.name}</strong>
                        <span>{course.code}</span>
                      </td>
                      <td>{students.length}</td>
                      <td>{ungraded}</td>
                      <td>{average}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="4">No assigned courses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ProfessorDashboard
