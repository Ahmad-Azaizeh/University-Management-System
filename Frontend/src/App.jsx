import { Routes, Route } from 'react-router-dom'

import Landing from './Pages/Common Pages/Landing'
import Login from './Pages/Common Pages/Login'
import ChangePassword from './Pages/Common Pages/ChangePassword'
import Dashboard from './Pages/Common Pages/Dashboard'
import DashboardHome from './Pages/Common Pages/DashboardHome'
import SectionPage from './Pages/Common Pages/SectionPage'
import AccountPage from './Pages/Common Pages/AccountPage'

import ProtectedRoute from './Components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

import ProfessorGradesPage from './Pages/Professor Pages/ProfessorGradesPage'

// Shared Pages
import StudentsPage from './Pages/Shared Pages/StudentsPage'
import CoursesPage from './Pages/Shared Pages/CoursesPage'
import ProfessorsPage from './Pages/Shared Pages/ProfessorsPage'
import EnrollmentsPage from './Pages/Shared Pages/EnrollmentPage'
import SchoolsPage from './Pages/Shared Pages/SchoolsPage'
import DirectorsPage from './Pages/Shared Pages/DirectorsPage'

// Student
import StudentDashboard from './Pages/Student Pages/StudentDashboard'
import StudentCoursesPage from './Pages/Student Pages/StudentCoursesPage'
import StudentEnrollmentsPage from './Pages/Student Pages/StudentEnrollmentPage'
import StudentGradesPage from './Pages/Student Pages/StudentGradesPage'



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
