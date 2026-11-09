
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function AccountPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [loginId, setLoginId] = useState(user?.loginId || "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setError("")

    if (!loginId.trim()) {
      setError("Login ID is required.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        "https://localhost:7245/api/Users/me/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            loginId: loginId.trim(),
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || "Failed to update account.")
      }

      updateUser({
        loginId: loginId.trim(),
      })

      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setLoginId(user?.loginId || "")
    setError("")
    setIsEditing(false)
  }

  return (
    <div className="account-page">
      <div className="account-page-heading">
        <h2>My Account</h2>
        <p>View and manage your account information.</p>
      </div>

      <section className="account-card">
        <div className="account-card-header">
          <div className="account-avatar">
            {user?.fullName?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <h3>{user?.fullName}</h3>
            <span>{user?.role}</span>
          </div>
        </div>

        <div className="account-divider" />

        <div className="account-information">
          <div className="account-info-item">
            <span>Full Name</span>
            <strong>{user?.fullName}</strong>
          </div>

          <div className="account-info-item">
            <span>Role</span>
            <strong>{user?.role}</strong>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="account-edit-form">
              <div className="account-field">
                <label htmlFor="loginId">Login ID</label>
                <input
                  id="loginId"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </div>

              {error && <p className="account-error">{error}</p>}

              <div className="account-actions">
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="account-cancel-button"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="account-info-item">
              <span>Login ID</span>
              <strong>{user?.loginId}</strong>
            </div>
          )}
        </div>

        {!isEditing && (
          <>
            <div className="account-divider" />

            <div className="account-actions">
              <button onClick={() => setIsEditing(true)}>
                Edit Login ID
              </button>

              <button
                className="account-password-button"
                onClick={() => navigate("/change-password")}
              >
                Change Password
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default AccountPage
