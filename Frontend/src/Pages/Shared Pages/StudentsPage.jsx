
import { Fragment, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = 'https://localhost:7245/api'

function StudentsPage() {
  const { user } = useAuth()

  const [students, setStudents] = useState([])
  const [schools, setSchools] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const isPresident =
    user?.role === 3 || user?.role === 'President'

  const [formData, setFormData] = useState({
    fullName: '',
    loginId: '',
    password: '',
    studentNumber: '',
    schoolId: '',
  })

  useEffect(() => {
    async function loadData() {
      if (!user?.token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const headers = {
          Authorization: `Bearer ${user.token}`,
        }

        const studentsResponse = await fetch(`${API}/Students`, {
          headers,
        })

        if (!studentsResponse.ok) {
          throw new Error('Failed to load students.')
        }

        const studentsData = await studentsResponse.json()
        setStudents(studentsData)

        if (isPresident) {
          const schoolsResponse = await fetch(`${API}/Schools`, {
            headers,
          })

          if (!schoolsResponse.ok) {
            throw new Error('Failed to load schools.')
          }

          const schoolsData = await schoolsResponse.json()
          setSchools(schoolsData)
        }
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.token, isPresident, refreshKey])

  const filteredStudents = students.filter((student) =>
    (student.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.studentNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreateForm() {
    setEditingStudent(null)

    setFormData({
      fullName: '',
      loginId: '',
      password: '',
      studentNumber: '',
      schoolId: '',
    })

    setError('')
    setShowForm(true)
  }

  function openEditForm(student) {
    setEditingStudent(student)

    setFormData({
      fullName: student.fullName || '',
      loginId: '',
      password: '',
      studentNumber: student.studentNumber || '',
      schoolId: String(student.schoolId || ''),
    })

    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingStudent(null)
    setError('')
  }

  function handleInputChange(e) {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.fullName.trim()) {
      setError('Student name is required.')
      return
    }

    if (editingStudent) {
      await updateStudent()
    } else {
      await createStudent()
    }
  }

  async function createStudent() {
    if (
      !formData.loginId.trim() ||
      !formData.password ||
      !formData.studentNumber.trim()
    ) {
      setError('Please complete all required fields.')
      return
    }

    if (isPresident && !formData.schoolId) {
      setError('Please select a school.')
      return
    }

    const payload = {
      fullName: formData.fullName.trim(),
      loginId: formData.loginId.trim(),
      password: formData.password,
      role: 0,
      studentNumber: formData.studentNumber.trim(),
      ...(isPresident && {
        schoolId: Number(formData.schoolId),
      }),
    }

    setSaving(true)

    try {
      const response = await fetch(`${API}/Users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(
          result?.message || 'Failed to create student.'
        )
      }

      closeForm()
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function updateStudent() {
    setSaving(true)

    try {
      const response = await fetch(
        `${API}/Users/${editingStudent.userId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName.trim(),
          }),
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(
          result?.message || 'Failed to update student.'
        )
      }

      closeForm()
      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.fullName}?`
    )

    if (!confirmed) return

    setError('')

    try {
      const response = await fetch(
        `${API}/Students/${student.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(
          result?.message || 'Failed to delete student.'
        )
      }

      if (selectedStudentId === student.id) {
        setSelectedStudentId(null)
      }

      setRefreshKey((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
  }

  if (loading) {
    return (
      <section className="dashboard-content">
        <p>Loading students...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">
      <div className="students-page-header">
        <div>
          <h2>Students</h2>
          <p>
            {isPresident
              ? 'Manage students across all university schools.'
              : 'Manage students in your school.'}
          </p>
        </div>

        <div className="students-header-actions">
          <span className="students-count">
            {filteredStudents.length} students
          </span>

          <button
            className="students-add-button"
            onClick={openCreateForm}
          >
            + Add Student
          </button>
        </div>
      </div>

      {error && (
        <p className="students-error">{error}</p>
      )}

      <input
        className="students-search"
        type="text"
        placeholder="Search by name or student number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Student Number</th>
              <th>School</th>
              <th>Courses</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => {
              const enrollments = student.enrollments || []

              return (
                <Fragment key={student.id}>
                  <tr>
                    <td>{student.fullName}</td>
                    <td>{student.studentNumber}</td>
                    <td>{student.schoolName}</td>
                    <td>{enrollments.length}</td>
                    <td>
                      <button
                        className="student-details-button"
                        onClick={() =>
                          setSelectedStudentId(
                            selectedStudentId === student.id
                              ? null
                              : student.id
                          )
                        }
                      >
                        {selectedStudentId === student.id
                          ? 'Hide'
                          : 'View'}
                      </button>
                    </td>

                    <td>
                      <div className="students-actions">
                        <button
                          className="students-edit-button"
                          onClick={() => openEditForm(student)}
                        >
                          Edit
                        </button>

                        <button
                          className="students-delete-button"
                          onClick={() => handleDelete(student)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {selectedStudentId === student.id && (
                    <tr>
                      <td colSpan="6">
                        <div className="student-enrollments">
                          <h3>Courses — {student.fullName}</h3>

                          {enrollments.length === 0 ? (
                            <p>No enrollments found.</p>
                          ) : (
                            <table className="student-courses-table">
                              <thead>
                                <tr>
                                  <th>Course</th>
                                  <th>Code</th>
                                  <th>Grade</th>
                                </tr>
                              </thead>

                              <tbody>
                                {enrollments.map((enrollment) => (
                                  <tr key={enrollment.enrollmentId}>
                                    <td>{enrollment.courseName}</td>
                                    <td>{enrollment.courseCode}</td>
                                    <td>
                                      {enrollment.grade ?? 'Not graded'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="6">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="students-modal-overlay">
          <div className="students-modal">
            <div className="students-modal-header">
              <h3>
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </h3>

              <button
                type="button"
                className="students-close-button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="student-full-name">Full Name</label>
              <input
                id="student-full-name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />

              {!editingStudent && (
                <>
                  <label htmlFor="student-login-id">Login ID</label>
                  <input
                    id="student-login-id"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="student-password">Initial Password</label>
                  <input
                    id="student-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="student-number">Student Number</label>
                  <input
                    id="student-number"
                    name="studentNumber"
                    value={formData.studentNumber}
                    onChange={handleInputChange}
                    required
                  />

                  {isPresident && (
                    <>
                      <label htmlFor="student-school">School</label>
                      <select
                        id="student-school"
                        name="schoolId"
                        value={formData.schoolId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a school</option>

                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </>
              )}

              {editingStudent && (
                <p className="students-form-note">
                  Only the student's name can be changed here.
                </p>
              )}

              {error && (
                <p className="students-error">{error}</p>
              )}

              <button
                type="submit"
                className="students-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingStudent
                    ? 'Update Student'
                    : 'Create Student'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default StudentsPage
