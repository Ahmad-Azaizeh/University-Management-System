
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'
const PAGE_SIZE = 100

async function fetchAllPages(endpoint, headers, signal) {
  let pageNumber = 1
  let totalPages = 1
  const allItems = []

  while (pageNumber <= totalPages) {
    const response = await fetch(
      `${API}/${endpoint}?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`,
      { headers, signal }
    )

    if (!response.ok) {
      throw new Error(`Failed to load ${endpoint}.`)
    }

    const data = await response.json()

    allItems.push(...(data.items ?? []))

    totalPages = data.totalPages ??
      Math.ceil((data.totalCount ?? 0) / PAGE_SIZE)

    pageNumber++
  }

  return allItems
}

function PresidentDashboard() {
  const { user } = useAuth()
  const token = user?.token

  const [schools, setSchools] = useState([])
  const [directors, setDirectors] = useState([])
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
        const headers = {
          Authorization: `Bearer ${token}`,
        }

        const [
          schoolsData,
          directorsData,
          studentsData,
          professorsData,
          coursesData,
          enrollmentsData,
        ] = await Promise.all([
          fetchAllPages('Schools', headers, controller.signal),
          fetchAllPages('Users/directors', headers, controller.signal),
          fetchAllPages('Students', headers, controller.signal),
          fetchAllPages('Professors', headers, controller.signal),
          fetchAllPages('Courses', headers, controller.signal),
          fetchAllPages('Enrollments', headers, controller.signal),
        ])

        setSchools(schoolsData)
        setDirectors(directorsData)
        setStudents(studentsData)
        setProfessors(professorsData)
        setCourses(coursesData)
        setEnrollments(enrollmentsData)
      } catch (err) {
        if (!controller.signal.aborted) {
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

  if (error) return <p className="error-message">{error}</p>

  const gradedEnrollments = enrollments.filter(
    (enrollment) => enrollment.grade !== null
  )

  const ungradedEnrollments = enrollments.filter(
    (enrollment) => enrollment.grade === null
  ).length

  const averageGrade =
    gradedEnrollments.length > 0
      ? (
          gradedEnrollments.reduce(
            (total, enrollment) => total + Number(enrollment.grade),
            0
          ) / gradedEnrollments.length
        ).toFixed(2)
      : 'N/A'

  function getSchoolStats(schoolId) {
    const schoolCourses = courses.filter(
      (course) => course.schoolId === schoolId
    )

    const schoolStudents = students.filter(
      (student) => student.schoolId === schoolId
    )

    const schoolProfessors = professors.filter(
      (professor) => professor.schoolId === schoolId
    )

    const schoolCourseIds = new Set(
      schoolCourses.map((course) => course.id)
    )

    const schoolEnrollments = enrollments.filter(
      (enrollment) => schoolCourseIds.has(enrollment.courseId)
    )

    const graded = schoolEnrollments.filter(
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
      students: schoolStudents.length,
      professors: schoolProfessors.length,
      courses: schoolCourses.length,
      enrollments: schoolEnrollments.length,
      average,
    }
  }

  function getDirectorName(directorUserId) {
    const director = directors.find(
      (d) => d.id === directorUserId
    )

    return director?.fullName || 'Not found'
  }

  return (
    <section className="president-dashboard">
      <header className="president-dashboard-header">
        <h2>University Overview</h2>
        <p>University-wide statistics and academic performance.</p>
      </header>

      <div className="president-stats-grid">
        <div className="president-stat-card">
          <p>Total Schools</p>
          <h3>{schools.length}</h3>
        </div>

        <div className="president-stat-card">
          <p>Total Directors</p>
          <h3>{directors.length}</h3>
        </div>

        <div className="president-stat-card">
          <p>Total Students</p>
          <h3>{students.length}</h3>
        </div>

        <div className="president-stat-card">
          <p>Total Professors</p>
          <h3>{professors.length}</h3>
        </div>

        <div className="president-stat-card">
          <p>Total Courses</p>
          <h3>{courses.length}</h3>
        </div>

        <div className="president-stat-card">
          <p>Total Enrollments</p>
          <h3>{enrollments.length}</h3>
        </div>

        <div className="president-stat-card">
          <p>Ungraded Enrollments</p>
          <h3>{ungradedEnrollments}</h3>
        </div>

        <div className="president-stat-card">
          <p>University Average Grade</p>
          <h3>{averageGrade}</h3>
        </div>
      </div>

      <div className="president-dashboard-schools">
        <h3>School Overview</h3>

        <div className="president-dashboard-table-wrapper">
          <table className="president-dashboard-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Director</th>
                <th>Students</th>
                <th>Professors</th>
                <th>Courses</th>
                <th>Enrollments</th>
                <th>Average Grade</th>
              </tr>
            </thead>

            <tbody>
              {schools.length === 0 ? (
                <tr>
                  <td colSpan="7">No schools found.</td>
                </tr>
              ) : (
                schools.map((school) => {
                  const stats = getSchoolStats(school.id)

                  return (
                    <tr key={school.id}>
                      <td><strong>{school.name}</strong></td>
                      <td>{getDirectorName(school.directorUserId)}</td>
                      <td>{stats.students}</td>
                      <td>{stats.professors}</td>
                      <td>{stats.courses}</td>
                      <td>{stats.enrollments}</td>
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

export default PresidentDashboard
