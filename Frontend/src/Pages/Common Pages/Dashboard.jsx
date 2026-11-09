
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function SidebarIcon({ name }) {
  const icons = {
    Dashboard: "M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z",

    Schools: "M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-5h6v5 M9 9h.01 M15 9h.01 M9 12h.01 M15 12h.01",

    Directors: "M12 3v4 M8 7h8 M5 11h14 M7 11v7 M17 11v7 M4 21h16 M12 11v10",
    
    Professors: "M12 3 2 8l10 5 10-5-10-5z M5 10.5V16l7 4 7-4v-5.5 M22 8v7",

    Students: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 8v6 M17 11h6",

    Courses: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5z M4 17.5A2.5 2.5 0 0 1 6.5 15H20 M8 6h8 M8 9h8",

    Enrollments: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",

    Grades: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",

  }

  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[name]} />
    </svg>
  )
}

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  const menuItems = {
    Student: ["Dashboard", "Courses", "Grades", "Enrollments"],

    Professor: ["Dashboard", "Courses", "Grades"],

    Director: [
      "Dashboard",
      "Students",
      "Professors",
      "Courses",
      "Enrollments",
    ],

    President: [
      "Dashboard",
      "Schools",
      "Directors",
      "Professors",
      "Courses",
      "Students",
      "Enrollments",
    ],
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>UMS</h2>

        <nav>
          {(menuItems[user?.role] || ["Dashboard"]).map((item) => {
            const path =
              item === "Dashboard"
                ? "/dashboard"
                : `/dashboard/${item.toLowerCase()}`

            return (
              <button
                key={item}
                className={
                  location.pathname === path ? "active" : ""
                }
                onClick={() => navigate(path)}
              >
                <SidebarIcon name={item} />
                <span>{item}</span>
              </button>
            )
          })}
        </nav>

        <button
          className="sidebar-account"
          onClick={() => navigate("/dashboard/account")}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>

          <span>Account</span>
        </button>

        
        <button
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>

          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
        </header>

        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard
