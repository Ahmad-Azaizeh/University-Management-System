import { Fragment, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API_URL = 'https://localhost:7245/api'

function CoursesPage() {
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [professors, setProfessors] = useState([])
  const [schools, setSchools] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')

  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [courseStudents, setCourseStudents] = useState({})
  const [studentLoading, setStudentLoading] = useState({})
  const [studentErrors, setStudentErrors] = useState({})

  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    schoolId: '',
    professorId: '',
  })

  const isPresident =
    user?.role === 3 || user?.role === 'President'

  const isDirector =
    user?.role === 2 || user?.role === 'Director'

  const canManageCourses = isPresident || isDirector

  // Fetch courses, professors, and schools
  useEffect(() => {
    async function fetchData() {
      try {
        const headers = {
          Authorization: `Bearer ${user.token}`,
        }

        const coursesResponse = await fetch(
          `${API_URL}/Courses`,
          { headers }
        )

        if (!coursesResponse.ok) {
          throw new Error('Failed to load courses.')
        }

        const coursesData = await coursesResponse.json()
        setCourses(coursesData)

        if (canManageCourses) {
          const professorsResponse = await fetch(
            `${API_URL}/Professors`,
            { headers }
          )

          if (!professorsResponse.ok) {
            throw new Error('Failed to load professors.')
          }

          const professorsData = await professorsResponse.json()
          setProfessors(professorsData)
        }

        if (isPresident) {
          const schoolsResponse = await fetch(
            `${API_URL}/Schools`,
            { headers }
          )

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

    if (user?.token) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [user, isPresident, canManageCourses])

  // View students enrolled in a course
  async function handleCourseView(courseId) {
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null)
      return
    }

    setSelectedCourseId(courseId)

    if (courseStudents[courseId]) return

    setStudentLoading((previous) => ({
      ...previous,
      [courseId]: true,
    }))

    setStudentErrors((previous) => ({
      ...previous,
      [courseId]: '',
    }))

    try {
      const response = await fetch(
        `${API_URL}/Enrollments/course/${courseId}/students`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load students for this course.')
      }

      const data = await response.json()

      setCourseStudents((previous) => ({
        ...previous,
        [courseId]: data,
      }))
    } catch (err) {
      setStudentErrors((previous) => ({
        ...previous,
        [courseId]: err.message || 'Something went wrong.',
      }))
    } finally {
      setStudentLoading((previous) => ({
        ...previous,
        [courseId]: false,
      }))
    }
  }

  // Open create form
  function openCreateForm() {
    setEditingCourse(null)
    setFormError('')

    setFormData({
      name: '',
      code: '',
      schoolId: '',
      professorId: '',
    })

    setShowForm(true)
  }

  // Open edit form
  function openEditForm(course) {
    setEditingCourse(course)
    setFormError('')

    setFormData({
      name: course.name,
      code: course.code,
      schoolId: String(course.schoolId),
      professorId: course.professorId
        ? String(course.professorId)
        : '',
    })

    setShowForm(true)
  }

  // Close form
  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingCourse(null)
    setFormError('')
  }

  // Handle form inputs
  function handleFormChange(e) {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'schoolId' ? { professorId: '' } : {}),
    }))
  }

  // Create or update course
  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Please fill in all required fields.')
      return
    }

    if (isPresident && !formData.schoolId) {
      setFormError('Please select a school.')
      return
    }

    setSaving(true)

    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      }

      const courseData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        schoolId: isPresident
          ? Number(formData.schoolId)
          : 0,
        professorId: formData.professorId
          ? Number(formData.professorId)
          : null,
      }

      let response

      if (editingCourse) {
        response = await fetch(
          `${API_URL}/Courses/${editingCourse.id}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify(courseData),
          }
        )
      } else {
        response = await fetch(`${API_URL}/Courses`, {
          method: 'POST',
          headers,
          body: JSON.stringify(courseData),
        })
      }

      if (!response.ok) {
        const message = await response.text()

        throw new Error(
          message ||
            `Failed to ${editingCourse ? 'update' : 'create'} course.`
        )
      }

      // Refresh courses
      const coursesResponse = await fetch(
        `${API_URL}/Courses`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!coursesResponse.ok) {
        throw new Error('Course saved, but the list could not be refreshed.')
      }

      const updatedCourses = await coursesResponse.json()
      setCourses(updatedCourses)

      setCourseStudents({})
      setSelectedCourseId(null)
      setShowForm(false)
      setEditingCourse(null)
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // Delete course
  async function handleDelete(course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${course.name}?`
    )

    if (!confirmed) return

    setError('')
    setDeletingCourseId(course.id)

    try {
      const response = await fetch(
        `${API_URL}/Courses/${course.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      )

      if (!response.ok) {
        const message = await response.text()

        throw new Error(message || 'Failed to delete course.')
      }

      setCourses((previous) =>
        previous.filter((c) => c.id !== course.id)
      )

      setCourseStudents((previous) => {
        const updated = { ...previous }
        delete updated[course.id]
        return updated
      })

      if (selectedCourseId === course.id) {
        setSelectedCourseId(null)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setDeletingCourseId(null)
    }
  }

  // Filter professors according to the selected school
  const availableProfessors = isPresident
    ? professors.filter(
        (professor) =>
          !formData.schoolId ||
          Number(professor.schoolId) === Number(formData.schoolId)
      )
    : professors

  // Search courses
  const filteredCourses = courses.filter((course) =>
    [
      course.name,
      course.code,
      course.schoolName,
      course.professorName,
    ].some((value) =>
      (value ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  if (loading) {
    return (
      <section className="dashboard-content">
        <p>Loading courses...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-content students-page">
      <div className="students-page-header">
        <div>
          <h2>Courses</h2>
          <p>
            {isPresident
              ? 'Manage courses across all university schools.'
              : 'Manage courses offered by your school.'}
          </p>
        </div>

        <div className="students-header-actions">
          <span className="students-count">
            {filteredCourses.length} courses
          </span>

          {canManageCourses && (
            <button
              className="students-add-button"
              onClick={openCreateForm}
            >
              + Add Course
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="students-error">{error}</p>
      )}

      <input
        className="students-search"
        type="text"
        placeholder="Search by course, code, school, or professor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="students-table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Course Code</th>
              <th>School</th>
              <th>Professor</th>
              <th>Number of Students</th>
              <th>Details</th>
              {canManageCourses && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {filteredCourses.map((course) => (
              <Fragment key={course.id}>
                <tr>
                  <td>{course.name}</td>
                  <td>{course.code}</td>
                  <td>{course.schoolName}</td>
                  <td>{course.professorName || 'Not assigned'}</td>
                  <td>{course.studentCount}</td>

                  <td>
                    <button
                      className="student-details-button"
                      onClick={() => handleCourseView(course.id)}
                    >
                      {selectedCourseId === course.id ? 'Hide' : 'View'}
                    </button>
                  </td>

                  {canManageCourses && (
                    <td>
                      <div className="students-actions">
                        <button
                          className="students-edit-button"
                          onClick={() => openEditForm(course)}
                        >
                          Edit
                        </button>

                        <button
                          className="students-delete-button"
                          disabled={deletingCourseId === course.id}
                          onClick={() => handleDelete(course)}
                        >
                          {deletingCourseId === course.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>

                {selectedCourseId === course.id && (
                  <tr>
                    <td colSpan={canManageCourses ? 7 : 6}>
                      <div className="student-enrollments">
                        <h3>
                          Students enrolled in {course.name}
                        </h3>

                        {studentLoading[course.id] && (
                          <p>Loading students...</p>
                        )}

                        {studentErrors[course.id] && (
                          <p className="students-error">
                            {studentErrors[course.id]}
                          </p>
                        )}

                        {!studentLoading[course.id] &&
                          !studentErrors[course.id] &&
                          courseStudents[course.id] && (
                            courseStudents[course.id].length === 0 ? (
                              <p>No students enrolled in this course.</p>
                            ) : (
                              <table className="student-courses-table">
                                <thead>
                                  <tr>
                                    <th>Student Name</th>
                                    <th>Student Number</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {courseStudents[course.id].map(
                                    (student, index) => (
                                      <tr
                                        key={`${student.studentNumber}-${index}`}
                                      >
                                        <td>{student.fullName}</td>
                                        <td>{student.studentNumber}</td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            )
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}

            {filteredCourses.length === 0 && (
              <tr>
                <td colSpan={canManageCourses ? 7 : 6}>
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="students-modal-overlay">
          <div className="students-modal">
            <div className="students-modal-header">
              <h2>
                {editingCourse ? 'Edit Course' : 'Add Course'}
              </h2>

              <button
                type="button"
                className="students-close-button"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Course Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />

              <label>Course Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                required
              />

              {isPresident && (
                <>
                  <label>School</label>
                  <select
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleFormChange}
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

              <label>Professor</label>
              <select
                name="professorId"
                value={formData.professorId}
                onChange={handleFormChange}
              >
                <option value="">Not assigned</option>

                {availableProfessors.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.fullName}
                  </option>
                ))}
              </select>

              {isDirector && (
                <p className="students-form-note">
                  Only professors from your school are available.
                </p>
              )}

              {formError && (
                <p className="students-error">{formError}</p>
              )}

              <button
                type="submit"
                className="students-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingCourse
                    ? 'Save Changes'
                    : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default CoursesPage