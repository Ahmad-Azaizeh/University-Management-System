
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'


const API = 'https://localhost:7245/api'

function PresidentDashboard() {
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
        const response = await fetch(`${API}/Dashboard/president`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load president dashboard.')
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

  if (error) {
    return <p className="error-message">{error}</p>
  }

  if (!dashboard) return null

  return (
    <section className="director-dashboard">
      <header className="director-dashboard-header">
        <h2>University Overview</h2>
        <p>University-wide statistics and academic performance.</p>
      </header>

      <div className="director-stats-grid">
        <div className="director-stat-card">
          <p>Total Schools</p>
          <h3>{dashboard.totalSchools}</h3>
        </div>

        <div className="director-stat-card">
          <p>Total Directors</p>
          <h3>{dashboard.totalDirectors}</h3>
        </div>

        <div className="director-stat-card">
          <p>Total Professors</p>
          <h3>{dashboard.totalProfessors}</h3>
        </div>

        <div className="director-stat-card">
          <p>Total Students</p>
          <h3>{dashboard.totalStudents}</h3>
        </div>

        <div className="director-stat-card">
          <p>Average Grade In Your University</p>
          <h3>{Number(dashboard.averageGrade).toFixed(2)} %</h3>
        </div>
      </div>
    </section>
  )
}

export default PresidentDashboard
