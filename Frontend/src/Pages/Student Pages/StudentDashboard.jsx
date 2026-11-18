
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function StudentDashboard() {
  const { user } = useAuth()
  const token = user?.token

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadDashboard() {
      try {
        const response = await fetch(`${API}/Dashboard/student`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load student dashboard.')
        }

        const data = await response.json()
        setDashboard(data)
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
  if (error) return <p className="error-message">{error}</p>
  if (!dashboard) return null

  return (
    <section className="director-dashboard">
      <header className="director-dashboard-header">
        <h2>Student Overview</h2>
        <p>Your academic progress and enrollment summary.</p>
      </header>

      <div className="director-stats-grid">
        <div className="director-stat-card">
          <p>Total Enrollments</p>
          <h3>{dashboard.totalEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Approved</p>
          <h3>{dashboard.approvedEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Pending</p>
          <h3>{dashboard.pendingEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Completed</p>
          <h3>{dashboard.completedEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Declined</p>
          <h3>{dashboard.declinedEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Failed</p>
          <h3>{dashboard.failedEnrollments}</h3>
        </div>

        <div className="director-stat-card">
          <p>Your Average Grade</p>
          <h3>{Number(dashboard.averageGrade).toFixed(2)} %</h3>
        </div>
      </div>
    </section>
  )
}

export default StudentDashboard
