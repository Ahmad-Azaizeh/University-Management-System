
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  function login(authData) {
    setUser(authData)
  }

  function logout() {
    setUser(null)
  }

  function updateUser(updatedData) {
    setUser((currentUser) => ({
      ...currentUser,
      ...updatedData,
    }))
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export { AuthProvider, useAuth }
