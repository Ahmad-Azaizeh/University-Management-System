import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ChangePassword() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (!user?.token || !user?.userId) {
      setError('Your session is missing. Please log in again.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `https://localhost:7245/api/Users/${user.userId}/change-password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      )

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to change password.')
      }

      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-form">
          <div className="login-brand">
            <h1>UMS</h1>
            <p>University Management System</p>
          </div>

          <h2>Change Your Password</h2>
          <p className="login-description">
            Change your temporary password to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default ChangePassword