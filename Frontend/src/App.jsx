
import { Routes, Route } from 'react-router-dom'
import Landing from './Pages/Landing'
import Login from './Pages/Login'
import ChangePassword from './Pages/ChangePassword'
import Dashboard from './Pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardHome from './Pages/DashboardHome'
import SectionPage from './Pages/SectionPage'
import StudentsPage from './Pages/StudentsPage'
import CoursesPage from './Pages/CoursesPage'
import ProfessorsPage from './Pages/ProfessorsPage'
import EnrollmentsPage from './Pages/EnrollmentPage'
import ProfessorGradesPage from './Pages/ProfessorGradesPage'
import StudentDashboard from './Pages/StudentDashboard'
import { useAuth } from './context/AuthContext'
import StudentCoursesPage from './Pages/StudentCoursesPage'
import StudentEnrollmentsPage from './Pages/StudentEnrollmentPage'
import StudentGradesPage from './Pages/StudentGradesPage'
import SchoolsPage from './Pages/SchoolsPage'
import DirectorsPage from './Pages/DirectorsPage'
import AccountPage from './Pages/AccountPage'



function App() {

  const {user} = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }>
        <Route index element={<DashboardHome />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="courses" element={
         user?.role === 'Student' ? <StudentCoursesPage/> : <CoursesPage/>} />
        
        <Route path="professors" element={<ProfessorsPage/>}/>
        
        <Route path="enrollments" element={
          user?.role === 'Student' ? <StudentEnrollmentsPage/> : <EnrollmentsPage/>
        } />
       
        <Route path="grades" element={
          user?.role === 'Student' ? <StudentGradesPage/>
          : user?.role === 'Professor' ? <ProfessorGradesPage/>
          : <SectionPage/>
        } />
        
        <Route path="student-home" element={<StudentDashboard/>} />
        <Route path="schools" element={<SchoolsPage/>} />
        <Route path="directors" element={<DirectorsPage/>} />
        <Route path="account" element={<AccountPage/>} />
        <Route path=":section" element={<SectionPage />} />
      </Route>
    </Routes>
  )
}

export default App
