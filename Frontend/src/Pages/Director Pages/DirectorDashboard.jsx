
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

function DirectorDashboard() {
  const { user } = useAuth()
  const token = user?.token

  const [students, setStudents] = useState([])
  const [professors, setProfessors] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadDashboard() {
      try {
        const [
          studentsData,
          professorsData,
          coursesData,
          enrollmentsData,
        ] = await Promise.all([
          fetchAllPages('Students', token, controller.signal),
          fetchAllPages('Professors', token, controller.signal),
          fetchAllPages('Courses', token, controller.signal),
          fetchAllPages('Enrollments', token, controller.signal),
        ])

        setStudents(studentsData)
        setProfessors(professorsData)
        setCourses(coursesData)
        setEnrollments(enrollmentsData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => controller.abort()
  }, [token])

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

  const enrollmentStatuses = [
    { label: 'Approved', value: 0 },
    { label: 'Pending', value: 1 },
    { label: 'Declined', value: 2 },
    { label: 'Completed', value: 3 },
    { label: 'Failed', value: 4 },
  ]

  function getPercentage(count) {
    return totalEnrollments > 0
      ? `${((count / totalEnrollments) * 100).toFixed(1)}%`
      : '0%'
  }

  const academicStats = [
    {
      label: 'Graded',
      count: gradedEnrollments.length,
    },
    {
      label: 'Ungraded',
      count: ungradedEnrollments,
    },
    ...enrollmentStatuses.map((status) => ({
      label: status.label,
      count: enrollments.filter(
        (enrollment) => Number(enrollment.status) === status.value
      ).length,
    })),
  ]

  const professorStats = courses.reduce((stats, course) => {
    const professorName = course.professorName || 'Not assigned'

    if (!stats[professorName]) {
      stats[professorName] = {
        name: professorName,
        courseCount: 0,
        enrollmentCount: 0,
        ungradedCount: 0,
      }
    }

    const courseEnrollments = enrollments.filter(
      (enrollment) =>
        Number(enrollment.courseId) === Number(course.id)
    )

    stats[professorName].courseCount += 1
    stats[professorName].enrollmentCount += courseEnrollments.length
    stats[professorName].ungradedCount += courseEnrollments.filter(
      (enrollment) => enrollment.grade === null
    ).length

    return stats
  }, {})

  const professorOverview = Object.values(professorStats)

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
        <h3>Academic Performance</h3>

        <div className="director-dashboard-table-wrapper">
          <table className="director-dashboard-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Enrollments</th>
                <th>Percentage</th>
              </tr>
            </thead>

            <tbody>
              {academicStats.map((stat) => (
                <tr key={stat.label}>
                  <td>{stat.label}</td>
                  <td>{stat.count}</td>
                  <td>{getPercentage(stat.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="director-dashboard-courses">
        <h3>Professor Overview</h3>

        <div className="director-dashboard-table-wrapper">
          <table className="director-dashboard-table">
            <thead>
              <tr>
                <th>Professor</th>
                <th>Assigned Courses</th>
                <th>Enrollments</th>
                <th>Ungraded</th>
              </tr>
            </thead>

            <tbody>
              {professorOverview.length === 0 ? (
                <tr>
                  <td colSpan="4">No professor data found.</td>
                </tr>
              ) : (
                professorOverview.map((professor) => (
                  <tr key={professor.name}>
                    <td>{professor.name}</td>
                    <td>{professor.courseCount}</td>
                    <td>{professor.enrollmentCount}</td>
                    <td>{professor.ungradedCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default DirectorDashboard
