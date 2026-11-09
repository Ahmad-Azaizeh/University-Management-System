
using UMS.Application.DTOs.Enrollments;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;
using UMS.Domain.Enums;

namespace UMS.Application.Services
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly IRepository<Enrollment> _enrollmentRepository;
        private readonly IRepository<Student> _studentRepository;
        private readonly IRepository<Course> _courseRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<School> _schoolRepository;
        private readonly IRepository<Professor> _professorRepository;

        public EnrollmentService(
            IRepository<Enrollment> enrollmentRepository,
            IRepository<Student> studentRepository,
            IRepository<Course> courseRepository,
            IRepository<User> userRepository,
            IRepository<School> schoolRepository,
            IRepository<Professor> professorRepository)
        {
            _enrollmentRepository = enrollmentRepository;
            _studentRepository = studentRepository;
            _courseRepository = courseRepository;
            _userRepository = userRepository;
            _schoolRepository = schoolRepository;
            _professorRepository = professorRepository;
        }

        
        private async Task EnsureEnrollmentAccessAsync(
            Enrollment enrollment, User user)
        {
            if (user.Role != UserRole.Director)
                return;

            var schoolId = await GetDirectorSchoolIdAsync(user.Id);
            var student = await _studentRepository.GetByIdAsync(enrollment.StudentId);
            var course = await _courseRepository.GetByIdAsync(enrollment.CourseId);

            if (student == null || course == null ||
                student.SchoolId != schoolId ||
                course.SchoolId != schoolId)
            {
                throw new UnauthorizedAccessException(
                    "You cannot access enrollments outside your school.");
            }
        }

        public async Task<IEnumerable<EnrollmentDto>> GetAllAsync(int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);

            var enrollments = await _enrollmentRepository.GetAllAsync(
                "Student.User",
                "Course"
            );

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);
                var students = await _studentRepository.GetAllAsync();

                var studentIds = students
                    .Where(s => s.SchoolId == schoolId)
                    .Select(s => s.Id)
                    .ToHashSet();

                enrollments = enrollments.Where(e =>
                    studentIds.Contains(e.StudentId) &&
                    e.Course.SchoolId == schoolId);
            }

            return enrollments.Select(e => new EnrollmentDto
            {
                Id = e.Id,
                StudentId = e.StudentId,
                StudentName = e.Student.User.FullName,
                StudentNumber = e.Student.StudentNumber,
                CourseId = e.CourseId,
                CourseName = e.Course.Name,
                CourseCode = e.Course.Code,
                EnrollmentDate = e.EnrollmentDate,
                Grade = e.Grade,
                Status = e.Status,
                DecisionDate = e.DecisionDate,
                CompletedAt = e.CompletedAt
            });
        }

        public async Task<EnrollmentDto?> GetByIdAsync(int id, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var enrollment = await _enrollmentRepository.GetByIdAsync(id);

            if (enrollment == null)
                return null;

            await EnsureEnrollmentAccessAsync(enrollment, user);

            return new EnrollmentDto
            {
                Id = enrollment.Id,
                StudentId = enrollment.StudentId,
                CourseId = enrollment.CourseId,
                EnrollmentDate = enrollment.EnrollmentDate,
                Grade = enrollment.Grade,
                Status = enrollment.Status,
                DecisionDate = enrollment.DecisionDate,
                CompletedAt = enrollment.CompletedAt
            };
        }


        public async Task<EnrollmentDto> CreateAsync(
            CreateEnrollmentDto dto,
            int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);

            var students = await _studentRepository.GetAllAsync("User");
            var student = students.FirstOrDefault(s => s.Id == dto.StudentId);

            if (student == null)
                throw new ArgumentException("Student does not exist.");

            var course = await _courseRepository.GetByIdAsync(dto.CourseId);

            if (course == null)
                throw new ArgumentException("Course does not exist.");

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (student.SchoolId != schoolId || course.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You can only enroll students in courses within your school.");
            }

            var enrollments = await _enrollmentRepository.GetAllAsync();

            var studentEnrollments = enrollments
                .Where(e => e.StudentId == student.Id)
                .ToList();

            var activeCount = studentEnrollments.Count(e =>
                e.Status == EnrollmentStatus.Pending ||
                e.Status == EnrollmentStatus.Approved);

            if (activeCount >= 5)
                throw new ArgumentException(
                    "This student already has five active enrollments.");

            var existingEnrollment = studentEnrollments.FirstOrDefault(e =>
                e.CourseId == course.Id &&
                (e.Status == EnrollmentStatus.Pending ||
                 e.Status == EnrollmentStatus.Approved ||
                 e.Status == EnrollmentStatus.Completed));

            if (existingEnrollment != null)
                throw new ArgumentException(
                    "This student already has an enrollment for this course.");

            var enrollment = new Enrollment
            {
                StudentId = student.Id,
                CourseId = course.Id,
                EnrollmentDate = DateTime.UtcNow,
                Status = EnrollmentStatus.Approved,
                DecisionDate = DateTime.UtcNow,
                DecidedByUserId = user.Id
            };

            await _enrollmentRepository.AddAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return new EnrollmentDto
            {
                Id = enrollment.Id,
                StudentId = student.Id,
                StudentName = student.User.FullName,
                StudentNumber = student.StudentNumber,
                CourseId = course.Id,
                CourseName = course.Name,
                CourseCode = course.Code,
                EnrollmentDate = enrollment.EnrollmentDate,
                Grade = enrollment.Grade,
                Status = enrollment.Status,
                DecisionDate = enrollment.DecisionDate,
                CompletedAt = enrollment.CompletedAt
            };
        }



        public async Task<bool> UpdateAsync(
            int id, UpdateEnrollmentDto dto, int currentUserId)
        {
            var user = await GetAuthorizedGradeUserAsync(currentUserId);

            var enrollment = await _enrollmentRepository.GetByIdAsync(id);

            if (enrollment == null)
                return false;

            if (enrollment.Status != EnrollmentStatus.Approved &&
                enrollment.Status != EnrollmentStatus.Completed &&
                enrollment.Status != EnrollmentStatus.Failed)
            {
                throw new ArgumentException(
                    "Only approved enrollments can receive grades.");
            }

            if (dto.Grade < 0 || dto.Grade > 100)
                throw new ArgumentException(
                    "Grade must be between 0 and 100.");

            if (user.Role == UserRole.Director)
            {
                await EnsureEnrollmentAccessAsync(enrollment, user);
            }
            else if (user.Role == UserRole.Professor)
            {
                var professors = await _professorRepository.GetAllAsync();

                var professor = professors.FirstOrDefault(
                    p => p.UserId == user.Id);

                if (professor == null)
                    throw new UnauthorizedAccessException(
                        "Professor profile not found.");

                var course = await _courseRepository.GetByIdAsync(
                    enrollment.CourseId);

                if (course == null || course.ProfessorId != professor.Id)
                    throw new UnauthorizedAccessException(
                        "You can only update grades for your assigned courses.");
            }

            if (enrollment.Status == EnrollmentStatus.Completed && dto.Grade == null)
            {
                throw new ArgumentException(
                    "A completed enrollment's grade cannot be cleared.");
            }

            enrollment.Grade = dto.Grade;

            if (dto.Grade.HasValue)
            {
                enrollment.Status = dto.Grade.Value >= 50
                    ? EnrollmentStatus.Completed
                    : EnrollmentStatus.Failed;

                if (enrollment.CompletedAt == null)
                {
                    enrollment.CompletedAt = DateTime.UtcNow;
                }
            }
            else
            {
                enrollment.Status = EnrollmentStatus.Approved;
                enrollment.CompletedAt = null;
            }

            _enrollmentRepository.Update(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return true;
        }


        public async Task<IEnumerable<CourseStudentDto>> GetStudentsByCourseAsync(int courseId, int currentUserId)
        {
            var user = await GetAuthorizedGradeUserAsync(currentUserId);

            var course = await _courseRepository.GetByIdAsync(courseId);

            if (course == null)
                throw new ArgumentException("Course not found.");

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (course.SchoolId != schoolId)
                    throw new UnauthorizedAccessException();
            }
            else if (user.Role == UserRole.Professor)
            {
                var professors = await _professorRepository.GetAllAsync();

                var professor = professors.FirstOrDefault(
                    p => p.UserId == user.Id);

                if (professor == null || course.ProfessorId != professor.Id)
                    throw new UnauthorizedAccessException(
                        "You can only view students in your assigned courses.");
            }

            var enrollments = await _enrollmentRepository.GetAllAsync();
            var students = await _studentRepository.GetAllAsync("User");

            var studentsById = students.ToDictionary(s => s.Id);

            return enrollments
                .Where(e =>
                    e.CourseId == courseId &&
                    studentsById.ContainsKey(e.StudentId) &&
                    (e.Status == EnrollmentStatus.Approved ||
                     e.Status == EnrollmentStatus.Completed ||
                     e.Status == EnrollmentStatus.Failed))
                .Select(e =>
                {
                    var student = studentsById[e.StudentId];

                    return new CourseStudentDto
                    {
                        EnrollmentId = e.Id,
                        FullName = student.User.FullName,
                        StudentNumber = student.StudentNumber,
                        Grade = e.Grade,
                        Status = e.Status,
                        EnrollmentDate = e.EnrollmentDate,
                        CompletedAt = e.CompletedAt
                    };
                })
                .ToList();
        }



        public async Task<EnrollmentDto> RequestEnrollmentAsync(RequestEnrollmentDto dto, int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null || user.Role != UserRole.Student)
                throw new UnauthorizedAccessException(
                    "Only students can submit enrollment requests.");

            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == user.Id);

            if (student == null)
                throw new UnauthorizedAccessException("Student profile not found.");

            var course = await _courseRepository.GetByIdAsync(dto.CourseId);

            if (course == null)
                throw new ArgumentException("Course does not exist.");

            if (student.SchoolId != course.SchoolId)
                throw new UnauthorizedAccessException(
                    "You can only request courses within your school.");

            var enrollments = await _enrollmentRepository.GetAllAsync();

            var studentEnrollments = enrollments
                .Where(e => e.StudentId == student.Id)
                .ToList();

            // Maximum five Pending or Approved enrollments
            var activeCount = studentEnrollments.Count(e =>
                e.Status == EnrollmentStatus.Pending ||
                e.Status == EnrollmentStatus.Approved);

            if (activeCount >= 5)
                throw new ArgumentException(
                    "You cannot have more than five active enrollments.");

            // Block duplicate Pending, Approved, or Completed enrollments
            var existingEnrollment = enrollments.FirstOrDefault(e =>
                e.StudentId == student.Id &&
                e.CourseId == dto.CourseId &&
                (e.Status == EnrollmentStatus.Pending ||
                 e.Status == EnrollmentStatus.Approved ||
                 e.Status == EnrollmentStatus.Completed));

            if (existingEnrollment != null)
            {
                throw new InvalidOperationException(
                    "You already have an active or completed enrollment for this course.");
            }

            // Enforce the three-month cooldown after rejection
            var recentDecline = studentEnrollments
                .Where(e =>
                    e.CourseId == dto.CourseId &&
                    e.Status == EnrollmentStatus.Declined &&
                    e.DecisionDate.HasValue)
                .OrderByDescending(e => e.DecisionDate)
                .FirstOrDefault();

            if (recentDecline != null &&
                recentDecline.DecisionDate!.Value.AddMonths(3) > DateTime.UtcNow)
            {
                throw new ArgumentException(
                    "You cannot request this course again until three months after its rejection.");
            }

            var enrollment = new Enrollment
            {
                StudentId = student.Id,
                CourseId = course.Id,
                EnrollmentDate = DateTime.UtcNow,
                Status = EnrollmentStatus.Pending
            };

            await _enrollmentRepository.AddAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return new EnrollmentDto
            {
                Id = enrollment.Id,
                StudentId = student.Id,
                StudentName = user.FullName,
                StudentNumber = student.StudentNumber,
                CourseId = course.Id,
                CourseName = course.Name,
                CourseCode = course.Code,
                EnrollmentDate = enrollment.EnrollmentDate,
                Grade = enrollment.Grade,
                Status = enrollment.Status,
                DecisionDate = enrollment.DecisionDate,
                CompletedAt = enrollment.CompletedAt
            };
        }

        public async Task<IEnumerable<EnrollmentDto>> GetMyEnrollmentsAsync(
            int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null || user.Role != UserRole.Student)
                throw new UnauthorizedAccessException(
                    "Only students can view their own enrollments.");

            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == user.Id);

            if (student == null)
                throw new UnauthorizedAccessException("Student profile not found.");

            var enrollments = await _enrollmentRepository.GetAllAsync(
                "Student.User",
                "Course"
            );

            return enrollments
                .Where(e => e.StudentId == student.Id)
                .Select(MapEnrollmentToDto)
                .ToList();
        }

        public async Task<bool> ApproveRequestAsync(
            int enrollmentId,
            int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);

            var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);

            if (enrollment == null)
                return false;

            if (enrollment.Status != EnrollmentStatus.Pending)
                throw new ArgumentException(
                    "Only pending requests can be approved.");

            await EnsureEnrollmentAccessAsync(enrollment, user);

            enrollment.Status = EnrollmentStatus.Approved;
            enrollment.DecisionDate = DateTime.UtcNow;
            enrollment.DecidedByUserId = user.Id;

            _enrollmentRepository.Update(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeclineRequestAsync(
            int enrollmentId,
            int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);

            var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);

            if (enrollment == null)
                return false;

            if (enrollment.Status != EnrollmentStatus.Pending)
                throw new ArgumentException(
                    "Only pending requests can be declined.");

            await EnsureEnrollmentAccessAsync(enrollment, user);

            enrollment.Status = EnrollmentStatus.Declined;
            enrollment.DecisionDate = DateTime.UtcNow;
            enrollment.DecidedByUserId = user.Id;

            _enrollmentRepository.Update(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return true;
        }

        private EnrollmentDto MapEnrollmentToDto(Enrollment enrollment)
        {
            return new EnrollmentDto
            {
                Id = enrollment.Id,
                StudentId = enrollment.StudentId,
                StudentName = enrollment.Student.User.FullName,
                StudentNumber = enrollment.Student.StudentNumber,
                CourseId = enrollment.CourseId,
                CourseName = enrollment.Course.Name,
                CourseCode = enrollment.Course.Code,
                EnrollmentDate = enrollment.EnrollmentDate,
                Grade = enrollment.Grade,
                Status = enrollment.Status,
                DecisionDate = enrollment.DecisionDate,
                CompletedAt = enrollment.CompletedAt
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
                    "You are not allowed to manage enrollments.");
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


        private async Task<User> GetAuthorizedGradeUserAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.Professor &&
                user.Role != UserRole.Director &&
                user.Role != UserRole.President)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to manage grades.");
            }

            return user;
        }
    }
}
