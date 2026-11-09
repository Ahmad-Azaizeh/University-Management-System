
using UMS.Application.DTOs.Professors;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;
using UMS.Domain.Enums;

namespace UMS.Application.Services
{
    public class ProfessorService : IProfessorService
    {
        private readonly IRepository<Professor> _professorRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<School> _schoolRepository;
        private readonly IRepository<Course> _courseRepository;

        public ProfessorService(
            IRepository<Professor> professorRepository,
            IRepository<User> userRepository,
            IRepository<School> schoolRepository,
            IRepository<Course> courseRepository)
        {
            _professorRepository = professorRepository;
            _userRepository = userRepository;
            _schoolRepository = schoolRepository;
            _courseRepository = courseRepository;
        }


        public async Task<IEnumerable<ProfessorDto>> GetAllAsync(int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);

            var professors = await _professorRepository.GetAllAsync(
                "User",
                "School",
                "Courses"
            );

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);
                professors = professors.Where(p => p.SchoolId == schoolId);
            }

            return professors.Select(p => new ProfessorDto
            {
                Id = p.Id,
                UserId = p.UserId,
                FullName = p.User.FullName,
                EmployeeNumber = p.EmployeeNumber,
                SchoolId = p.SchoolId,
                SchoolName = p.School.Name,
                CourseCount = p.Courses.Count
            });
        }


        public async Task<ProfessorDto?> GetByIdAsync(int id, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var professor = await _professorRepository.GetByIdAsync(id);

            if (professor == null)
                return null;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (professor.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot access professors from another school.");
            }

            return new ProfessorDto
            {
                Id = professor.Id,
                UserId = professor.UserId,
                SchoolId = professor.SchoolId,
                EmployeeNumber = professor.EmployeeNumber
            };
        }


        public async Task<ProfessorDto> CreateAsync(CreateProfessorDto dto, int currentUserId)
        {
            var currentUser = await GetAuthorizedUserAsync(currentUserId);

            var user = await _userRepository.GetByIdAsync(dto.UserId);

            if (user == null)
                throw new ArgumentException("User does not exist.");

            if (user.Role != UserRole.Professor)
                throw new ArgumentException(
                    "The user must have the Professor role.");

            int schoolId = dto.SchoolId;

            if (currentUser.Role == UserRole.Director)
            {
                schoolId = await GetDirectorSchoolIdAsync(currentUser.Id);
            }

            var school = await _schoolRepository.GetByIdAsync(schoolId);

            if (school == null)
                throw new ArgumentException("School does not exist.");

            var professors = await _professorRepository.GetAllAsync();

            if (professors.Any(p => p.UserId == dto.UserId))
                throw new ArgumentException(
                    "This user already has a professor profile.");

            if (professors.Any(p => p.EmployeeNumber == dto.EmployeeNumber))
                throw new ArgumentException(
                    "Employee number already exists.");

            var professor = new Professor
            {
                UserId = dto.UserId,
                SchoolId = schoolId,
                EmployeeNumber = dto.EmployeeNumber
            };

            await _professorRepository.AddAsync(professor);
            await _professorRepository.SaveChangesAsync();

            return new ProfessorDto
            {
                Id = professor.Id,
                UserId = professor.UserId,
                SchoolId = professor.SchoolId,
                EmployeeNumber = professor.EmployeeNumber
            };
        }


        public async Task<bool> UpdateAsync(
            int id, UpdateProfessorDto dto, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var professor = await _professorRepository.GetByIdAsync(id);

            if (professor == null)
                return false;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (professor.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot update professors from another school.");

                if (dto.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot move a professor to another school.");
            }

            var school = await _schoolRepository.GetByIdAsync(dto.SchoolId);

            if (school == null)
                throw new ArgumentException("School does not exist.");

            professor.SchoolId = dto.SchoolId;

            _professorRepository.Update(professor);
            await _professorRepository.SaveChangesAsync();

            return true;
        }


        public async Task<bool> DeleteAsync(int id, int currentUserId)
        {
            var user = await GetAuthorizedUserAsync(currentUserId);
            var professor = await _professorRepository.GetByIdAsync(id);

            if (professor == null)
                return false;

            if (user.Role == UserRole.Director)
            {
                var schoolId = await GetDirectorSchoolIdAsync(user.Id);

                if (professor.SchoolId != schoolId)
                    throw new UnauthorizedAccessException(
                        "You cannot delete professors from another school.");
            }

            var courses = await _courseRepository.GetAllAsync();

            if (courses.Any(c => c.ProfessorId == id))
                throw new ArgumentException(
                    "Cannot delete a professor who is assigned to a course.");

            var professorUser = await _userRepository.GetByIdAsync(
                professor.UserId);

            if (professorUser == null)
                throw new InvalidOperationException(
                    "The professor's user account could not be found.");

            _professorRepository.Delete(professor);
            _userRepository.Delete(professorUser);

            await _professorRepository.SaveChangesAsync();

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
                    "You are not allowed to manage professors.");
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
    }
}
