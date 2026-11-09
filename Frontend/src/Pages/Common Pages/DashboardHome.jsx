import { useAuth } from '../../context/AuthContext'
import DirectorDashboard from '../DirectorDashboard'
import PresidentDashboard from '../PresidentDashboard'
import ProfessorDashboard from '../ProfessorDashboard'
import StudentDashboard from '../Student Pages/StudentDashboard'

function DashboardHome() {
  const { user } = useAuth()

  if (user?.role === 'Student') {
    return <StudentDashboard />
  }

  if (user?.role === 'Professor') {
    return <ProfessorDashboard/>
  }

  if (user?.role === 'Director') {
    return <DirectorDashboard/>
  }

  if (user?.role === 'President') {
    return <PresidentDashboard/>
  }

  return (
    <section className="dashboard-content">
      <h2>Welcome to UMS</h2>
      <p>Your university management workspace.</p>
    </section>
  )
}

export default DashboardHome
