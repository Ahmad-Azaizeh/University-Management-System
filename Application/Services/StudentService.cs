
using UMS.Application.DTOs.Common;
using UMS.Application.DTOs.Students;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;
using UMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace UMS.Application.Services
{
    public class StudentService : IStudentService
    {
        private readonly IRepository<Student> _studentRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<School> _schoolRepository;
        private readonly IRepository<Enrollment> _enrollmentRepository;

        public StudentService(
            IRepository<Student> studentRepository,
            IRepository<User> userRepository,
            IRepository<School> schoolRepository,
            IRepository<Enrollment> enrollmentRepository)
        {
            _studentRepository = studentRepository;
            _userRepository = userRepository;
            _schoolRepository = schoolRepository;
            _enrollmentRepository = enrollmentRepository;
        }



        public async Task<IEnumerable<StudentDto>> GetAllAsync(int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);

            var students = _studentRepository.GetQueryable(
                "User",
                "School",
                "Enrollments.Course");

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);
                students = students.Where(s => s.SchoolId == schoolId);
            }

            return await students.Select(s => new StudentDto
            {
                Id = s.Id,
                UserId = s.UserId,
                FullName = s.User.FullName,
                StudentNumber = s.StudentNumber,
                SchoolId = s.SchoolId,
                SchoolName = s.School.Name,

                Enrollments = s.Enrollments.Select(e => new StudentEnrollmentDto
                {
                    EnrollmentId = e.Id,
                    CourseId = e.CourseId,
                    CourseName = e.Course.Name,
                    CourseCode = e.Course.Code,
                    Grade = e.Grade,
                    Status = e.Status
                }).ToList()
            }).ToListAsync();
        }


        public async Task<PagedResultDto<StudentDto>> GetAllPagedAsync(
            int currentUserId,
            int pageNumber,
            int pageSize,
            string? searchTerm = null,
            int? schoolId = null,
            int? courseId = null)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);

            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _studentRepository.GetQueryable(
                "User",
                "School",
                "Enrollments.Course");

            if (user.Role == UserRole.Director)
            {
                var directorSchoolId = await GetDirectorSchoolIdAsync(user.Id);

                query = query.Where(s => s.SchoolId == directorSchoolId);
            }
            else if (schoolId.HasValue)
            {
                query = query.Where(s => s.SchoolId == schoolId.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(s =>
                    s.User.FullName.Contains(searchTerm) ||
                    s.StudentNumber.Contains(searchTerm));
            }

            if (courseId.HasValue)
            {
                query = query.Where(s =>
                    s.Enrollments.Any(e => e.CourseId == courseId.Value));
            }

            var totalCount = await query.CountAsync();

            var students = await query
                .OrderBy(s => s.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var studentDtos = students.Select(s => new StudentDto
            {
                Id = s.Id,
                UserId = s.UserId,
                FullName = s.User.FullName,
                StudentNumber = s.StudentNumber,
                SchoolId = s.SchoolId,
                SchoolName = s.School.Name,

                Enrollments = s.Enrollments.Select(e => new StudentEnrollmentDto
                {
                    EnrollmentId = e.Id,
                    CourseId = e.CourseId,
                    CourseName = e.Course.Name,
                    CourseCode = e.Course.Code,
                    Grade = e.Grade,
                    Status = e.Status,
                    EnrollmentDate = e.EnrollmentDate
                }).ToList()
            }).ToList();

            return new PagedResultDto<StudentDto>
            {
                Items = studentDtos,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }



        public async Task<StudentDto?> GetByIdAsync(
            int id, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var student = await _studentRepository.GetByIdAsync(id);

            if (student == null)
                return null;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (student.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot access students from another school.");
            }

            return new StudentDto
            {
                Id = student.Id,
                UserId = student.UserId,
                StudentNumber = student.StudentNumber,
                SchoolId = student.SchoolId
            };
        }


        public async Task<StudentDto> CreateAsync(
            CreateStudentDto dto, int currentUserId)
        {
            var currentUser = await GetAuthorizedUserAsync(currentUserId);

            var user = await _userRepository.GetByIdAsync(dto.UserId);

            if (user == null)
                throw new ArgumentException("User does not exist.");

            if (user.Role != UserRole.Student)
                throw new ArgumentException(
                    "The user must have the Student role.");

            int schoolId = dto.SchoolId;

            if (currentUser.Role == UserRole.Director)
            {
                // A director can only create students in their own school.
                schoolId = await GetDirectorSchoolIdAsync(currentUser.Id);
            }

            var school = await _schoolRepository.GetByIdAsync(schoolId);

            if (school == null)
                throw new ArgumentException("School does not exist.");

            var userAlreadyHasProfile = await _studentRepository.GetQueryable()
                .AnyAsync(s => s.UserId == dto.UserId);

            if (userAlreadyHasProfile)
                throw new ArgumentException(
                    "This user already has a student profile.");

            var studentNumberExists = await _studentRepository.GetQueryable()
                .AnyAsync(s => s.StudentNumber == dto.StudentNumber);

            if (studentNumberExists)
                throw new ArgumentException(
                    "A student with this number already exists.");

            var student = new Student
            {
                UserId = dto.UserId,
                StudentNumber = dto.StudentNumber,
                SchoolId = schoolId
            };

            await _studentRepository.AddAsync(student);
            await _studentRepository.SaveChangesAsync();

            return new StudentDto
            {
                Id = student.Id,
                UserId = student.UserId,
                StudentNumber = student.StudentNumber,
                SchoolId = student.SchoolId
            };
        }


        public async Task<bool> UpdateAsync(
            int id, UpdateStudentDto dto, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var student = await _studentRepository.GetByIdAsync(id);

            if (student == null)
                return false;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (student.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot update students from another school.");

                if (dto.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot move a student to another school.");
            }

            var school = await _schoolRepository.GetByIdAsync(dto.SchoolId);

            if (school == null)
                throw new ArgumentException("School does not exist.");

            student.SchoolId = dto.SchoolId;

            _studentRepository.Update(student);
            await _studentRepository.SaveChangesAsync();

            return true;
        }


        public async Task<bool> DeleteAsync(int id, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var student = await _studentRepository.GetByIdAsync(id);

            if (student == null)
                return false;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (student.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot delete students from another school.");
            }

            var studentUser = await _userRepository.GetByIdAsync(student.UserId);

            if (studentUser == null)
                throw new ArgumentException(
                    "The associated student account does not exist.");

            _studentRepository.Delete(student);
            _userRepository.Delete(studentUser);

            await _studentRepository.SaveChangesAsync();

            return true;
        }


        public async Task<StudentDto?> GetMyDashboardAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.Student)
                throw new UnauthorizedAccessException(
                    "Only students can access this dashboard.");

            var student = await _studentRepository.GetQueryable(
                "User",
                "School",
                "Enrollments.Course.Professor.User")
            .FirstOrDefaultAsync(s => s.UserId == currentUserId);

            if (student == null)
                return null;

            return new StudentDto
            {
                Id = student.Id,
                UserId = student.UserId,
                FullName = student.User.FullName,
                StudentNumber = student.StudentNumber,
                SchoolId = student.SchoolId,
                SchoolName = student.School.Name,

                Enrollments = student.Enrollments.Select(e =>
                    new StudentEnrollmentDto
                    {
                        EnrollmentId = e.Id,
                        CourseId = e.CourseId,
                        CourseName = e.Course.Name,
                        CourseCode = e.Course.Code,
                        ProfessorName = e.Course.Professor != null
                            ? e.Course.Professor.User.FullName
                            : "Not assigned",
                        Grade = e.Grade,
                        EnrollmentDate = e.EnrollmentDate,
                        Status = e.Status
                    }).ToList()
            };
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
                    "You are not allowed to manage students.");
            }

            return user;
        }


        private async Task<int> GetDirectorSchoolIdAsync(int directorUserId)
        {
            var schoolId = await _schoolRepository.GetQueryable()
                .Where(s => s.DirectorUserId == directorUserId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();

            if (schoolId == null)
                throw new UnauthorizedAccessException(
                    "This director is not assigned to a school.");

            return schoolId.Value;
        }
    }
}
