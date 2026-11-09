import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('https://localhost:7245/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginId,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid login credentials.')
      }

      login(data)

      if(data.mustChangePassword){
        navigate('/change-password')
      }
      else {
        navigate('/dashboard')
      }

    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        <div className="login-form">
          <div className="login-brand">
            <h1>UMS</h1>
            <p>University Management System</p>
          </div>

          <h2>Welcome Back</h2>
          <p className="login-description">
            Sign in to access your university dashboard.
          </p>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="loginId">Login ID</label>
              <input
                type="text"
                id="loginId"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your login ID"
                required
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default Login