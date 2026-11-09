import { Navigate, useNavigate } from "react-router-dom"

function Landing() {
    const navigate = useNavigate()


  return (
    <main className="landing">
      <section className="landing-panel">
        <div className="landing-brand">
          <h1>UMS</h1>
          <p>University Management System</p>
        </div>

        <button className="login-button"
        onClick={() => navigate('/login')}>
          Log In 
        </button>
      </section>
    </main>
  )
}

export default Landing

