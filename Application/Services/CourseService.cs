
using UMS.Application.DTOs.Courses;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;
using UMS.Domain.Enums;

namespace UMS.Application.Services
{
    public class CourseService : ICourseService
    {
        private readonly IRepository<Course> _courseRepository;
        private readonly IRepository<Professor> _professorRepository;
        private readonly IRepository<School> _schoolRepository;
        private readonly IRepository<Enrollment> _enrollmentRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<Student> _studentRepository;

        public CourseService(
            IRepository<Course> courseRepository,
            IRepository<Professor> professorRepository,
            IRepository<School> schoolRepository,
            IRepository<Enrollment> enrollmentRepository,
            IRepository<User> userRepository,
            IRepository<Student> studentRepository)
        {
            _courseRepository = courseRepository;
            _professorRepository = professorRepository;
            _schoolRepository = schoolRepository;
            _enrollmentRepository = enrollmentRepository;
            _userRepository = userRepository;
            _studentRepository = studentRepository;
        }


        public async Task<IEnumerable<CourseDto>> GetAllAsync(int currentUserId)
        {
            var user = await GetAuthorizedCourseViewerAsync(currentUserId);

            var courses = await _courseRepository.GetAllAsync(
                "School",
                "Professor.User"
            );

            var enrollments = await _enrollmentRepository.GetAllAsync();

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                courses = courses.Where(c => c.SchoolId == schoolId);
            }
            else if (user.Role == UserRole.Professor)
            {
                var professors = await _professorRepository.GetAllAsync();

                var professor = professors.FirstOrDefault(
                    p => p.UserId == user.Id);

                if (professor == null)
                    throw new UnauthorizedAccessException(
                        "Professor profile not found.");

                courses = courses.Where(
                    c => c.ProfessorId == professor.Id);
            }

            else if (user.Role == UserRole.Student)
            {
                var students = await _studentRepository.GetAllAsync();

                var student = students.FirstOrDefault(
                    s => s.UserId == user.Id);

                if (student == null)
                    throw new UnauthorizedAccessException(
                        "Student profile not found.");

                courses = courses.Where(
                    c => c.SchoolId == student.SchoolId);
            }

            return courses.Select(c => new CourseDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                SchoolId = c.SchoolId,
                SchoolName = c.School.Name,
                ProfessorId = c.ProfessorId,
                ProfessorName = c.Professor == null
                    ? null
                    : c.Professor.User.FullName,
                StudentCount = enrollments.Count(e => e.CourseId == c.Id)
            });
        }

        public async Task<CourseDto?> GetByIdAsync(int id, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var course = await _courseRepository.GetByIdAsync(id);

            if (course == null)
                return null;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (course.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot access courses from another school.");
            }

            return new CourseDto
            {
                Id = course.Id,
                Name = course.Name,
                Code = course.Code,
                ProfessorId = course.ProfessorId,
                SchoolId = course.SchoolId
            };
        }

        public async Task<CourseDto> CreateAsync(
            CreateCourseDto dto, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            int schoolId = dto.SchoolId;

            if (user.Role == UserRole.Director)
                schoolId = await GetDirectorSchoolIdAsync(user.Id);

            var school = await _schoolRepository.GetByIdAsync(schoolId);

            if (school == null)
                throw new ArgumentException("School does not exist.");

            if (dto.ProfessorId.HasValue)
            {
                var professor = await _professorRepository.GetByIdAsync(
                    dto.ProfessorId.Value);

                if (professor == null)
                    throw new ArgumentException("Professor does not exist.");

                if (professor.SchoolId != schoolId)
                    throw new ArgumentException(
                        "Professor must belong to the course's school.");
            }

            var courses = await _courseRepository.GetAllAsync();

            if (courses.Any(c => c.Code == dto.Code))
                throw new ArgumentException(
                    "A course with this code already exists.");

            var course = new Course
            {
                Name = dto.Name,
                Code = dto.Code,
                SchoolId = schoolId,
                ProfessorId = dto.ProfessorId
            };

            await _courseRepository.AddAsync(course);
            await _courseRepository.SaveChangesAsync();

            return new CourseDto
            {
                Id = course.Id,
                Name = course.Name,
                Code = course.Code,
                ProfessorId = course.ProfessorId,
                SchoolId = course.SchoolId
            };
        }

        public async Task<bool> UpdateAsync(
            int id, UpdateCourseDto dto, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var course = await _courseRepository.GetByIdAsync(id);

            if (course == null)
                return false;

            int schoolId = dto.SchoolId;

            if (user.Role == UserRole.Director)
            {
                var directorSchoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (course.SchoolId != directorSchoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot update courses from another school.");

                if (dto.SchoolId != directorSchoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot move a course to another school.");

                schoolId = directorSchoolId;
            }

            var school = await _schoolRepository.GetByIdAsync(schoolId);

            if (school == null)
                throw new ArgumentException("School does not exist.");

            if (dto.ProfessorId.HasValue)
            {
                var professor = await _professorRepository.GetByIdAsync(
                    dto.ProfessorId.Value);

                if (professor == null)
                    throw new ArgumentException("Professor does not exist.");

                if (professor.SchoolId != schoolId)
                    throw new ArgumentException(
                        "Professor must belong to the course's school.");
            }

            var courses = await _courseRepository.GetAllAsync();

            if (courses.Any(c => c.Id != id && c.Code == dto.Code))
                throw new ArgumentException(
                    "A course with this code already exists.");

            course.Name = dto.Name;
            course.Code = dto.Code;
            course.SchoolId = schoolId;
            course.ProfessorId = dto.ProfessorId;

            _courseRepository.Update(course);
            await _courseRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(int id, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var course = await _courseRepository.GetByIdAsync(id);

            if (course == null)
                return false;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (course.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot delete courses from another school.");
            }

            var enrollments = await _enrollmentRepository.GetAllAsync();

            if (enrollments.Any(e => e.CourseId == id))
                throw new ArgumentException(
                    "Cannot delete a course that has student enrollments.");

            _courseRepository.Delete(course);
            await _courseRepository.SaveChangesAsync();

            return true;
        }


        private async Task<User> GetAuthorizedUserAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.President &&
                user.Role != UserRole.Director)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to manage courses.");
            }

            return user;
        }

        private async Task<int> GetDirectorSchoolIdAsync(int directorUserId)
        {
            var schools = await _schoolRepository.GetAllAsync();

            var school = schools.FirstOrDefault(
                s => s.DirectorUserId == directorUserId);

            if (school == null)
                throw new UnauthorizedAccessException(
                    "This director is not assigned to a school.");

            return school.Id;
        }


        private async Task<User> GetAuthorizedCourseViewerAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.President &&
                user.Role != UserRole.Director &&
                user.Role != UserRole.Professor &&
                user.Role != UserRole.Student)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to view courses.");
            }

            return user;
        }
    }
}
