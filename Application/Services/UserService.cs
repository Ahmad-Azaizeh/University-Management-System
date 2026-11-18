using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using UMS.Application.DTOs.Common;
using UMS.Application.DTOs.Users;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;
using UMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace UMS.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<Student> _studentRepository;
        private readonly IRepository<School> _schoolRepository;
        private readonly IRepository<Professor> _professorRepository;
        private readonly IPasswordHasher<User> _passwordHasher;

        public UserService(IRepository<User> userRepository, 
            IPasswordHasher<User> passwordHasher, 
            IRepository<Student> studentRepository, 
            IRepository<Professor> professorRepository,
            IRepository<School> schoolRepository)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _studentRepository = studentRepository;
            _professorRepository = professorRepository;
            _schoolRepository = schoolRepository;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _userRepository.GetAllAsync();

            return users.Select(u => new UserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                LoginId = u.LoginId,
                Role = u.Role,
                MustChangePassword = u.MustChangePassword
            });
        }

        public async Task<PagedResultDto<UserDto>> GetDirectorsPagedAsync(int pageNumber, int pageSize, string? searchTerm = null)
        {
            if (pageNumber < 1)
                throw new ArgumentException("Page number must be greater than 0.");

            if (pageSize < 1)
                throw new ArgumentException("Page size must be greater than 0.");

            Expression<Func<User, bool>> filter = u =>
                u.Role == UserRole.Director;

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                filter = u =>
                    u.Role == UserRole.Director &&
                    u.FullName.Contains(searchTerm);
            }

            var (directors, totalCount) = await _userRepository.GetPagedAsync(
                pageNumber, pageSize, filter);

            var items = directors.Select(u => new UserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                LoginId = u.LoginId,
                Role = u.Role,
                MustChangePassword = u.MustChangePassword
            });

            return new PagedResultDto<UserDto>
            {
                Items = items,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<UserDto?> GetByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;
            
            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                LoginId = user.LoginId,
                Role = user.Role,
                MustChangePassword = user.MustChangePassword
            };
        }



        public async Task<UserDto> CreateAsync(CreateUserDto dto, int currentUserId)
        {
            var currentUser = await _userRepository.GetByIdAsync(currentUserId);

            if (currentUser == null)
                throw new UnauthorizedAccessException("User not found.");

            if (currentUser.Role != UserRole.President &&
                currentUser.Role != UserRole.Director)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to create users.");
            }

            if (dto.Role == UserRole.President)
                throw new UnauthorizedAccessException(
                    "A President account cannot be created through user management.");

            int schoolId;

            if (currentUser.Role == UserRole.Director)
            {
                var directorSchoolId = await _schoolRepository.GetQueryable()
                    .Where(s => s.DirectorUserId == currentUser.Id)
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync();

                if (directorSchoolId == null)
                    throw new InvalidOperationException(
                        "The Director is not assigned to a school.");

                if (dto.Role != UserRole.Student &&
                    dto.Role != UserRole.Professor)
                {
                    throw new UnauthorizedAccessException(
                        "Directors can only create Student or Professor accounts.");
                }

                schoolId = directorSchoolId.Value;
            }
            else
            {
                if (dto.Role == UserRole.Student ||
                    dto.Role == UserRole.Professor)
                {
                    if (!dto.SchoolId.HasValue)
                        throw new ArgumentException(
                            "SchoolId is required for Student and Professor accounts.");

                    var school = await _schoolRepository.GetByIdAsync(dto.SchoolId.Value);

                    if (school == null)
                        throw new ArgumentException("The specified school does not exist.");

                    schoolId = school.Id;
                }
                else
                {
                    schoolId = 0;
                }
            }

            var loginIdExists = await _userRepository.GetQueryable()
                .AnyAsync(u => u.LoginId == dto.LoginId);

            if (loginIdExists)
                throw new ArgumentException("This LoginId is already in use.");

            if (dto.Role == UserRole.Student)
            {
                var studentNumberExists = await _studentRepository.GetQueryable()
                    .AnyAsync(s => s.StudentNumber == dto.StudentNumber);

                if (studentNumberExists)
                    throw new ArgumentException(
                        "This StudentNumber is already in use.");
            }

            if (dto.Role == UserRole.Professor)
            {
                var employeeNumberExists = await _professorRepository.GetQueryable()
                    .AnyAsync(p => p.EmployeeNumber == dto.EmployeeNumber);

                if (employeeNumberExists)
                    throw new ArgumentException(
                        "This EmployeeNumber is already in use.");
            }

            var user = new User
            {
                FullName = dto.FullName,
                LoginId = dto.LoginId,
                Role = dto.Role,
                MustChangePassword = true,
                PasswordHash = string.Empty
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            if (dto.Role == UserRole.Student)
            {
                await _studentRepository.AddAsync(new Student
                {
                    UserId = user.Id,
                    StudentNumber = dto.StudentNumber!,
                    SchoolId = schoolId
                });
            }
            else if (dto.Role == UserRole.Professor)
            {
                await _professorRepository.AddAsync(new Professor
                {
                    UserId = user.Id,
                    EmployeeNumber = dto.EmployeeNumber!,
                    SchoolId = schoolId
                });
            }

            await _userRepository.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                LoginId = user.LoginId,
                Role = user.Role,
                MustChangePassword = user.MustChangePassword
            };
        }




        public async Task<bool> UpdateAsync(int id, UpdateUserDto dto, int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            var currentUser = await _userRepository.GetByIdAsync(currentUserId);

            if (currentUser == null)
                return false;

            if (currentUser.Role == UserRole.Director &&
                !await CanDirectorManageUserAsync(currentUser, user))
            {
                throw new UnauthorizedAccessException(
                    "You can only manage users within your own school.");
            }

            if (currentUser.Role != UserRole.Director &&
                currentUser.Role != UserRole.President)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to update users.");
            }

            user.FullName = dto.FullName;
            
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            
            return true;
        }


        public async Task<bool> DeleteAsync(int id, int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
                return false;

            if (user.Role == UserRole.President)
            {
                throw new UnauthorizedAccessException(
                    "The President account cannot be deleted through user management.");
            }

            var currentUser = await _userRepository.GetByIdAsync(currentUserId);

            if (currentUser == null)
                return false;

            if (currentUser.Role == UserRole.Director &&
                !await CanDirectorManageUserAsync(currentUser, user))
            {
                throw new UnauthorizedAccessException(
                    "You can only delete users within your own school.");
            }

            if (currentUser.Role != UserRole.Director &&
                currentUser.Role != UserRole.President)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to delete users.");
            }

            _userRepository.Delete(user);

            await _userRepository.SaveChangesAsync();

            return true;
        }


        public async Task<bool> ChangePasswordAsync(int id, ChangePasswordDto dto)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
                return false;

            var verificationResult = _passwordHasher.VerifyHashedPassword(user,
                user.PasswordHash,
                dto.CurrentPassword);

            if (verificationResult == PasswordVerificationResult.Failed)
                throw new ArgumentException("Current password is incorrect.");

            user.PasswordHash = _passwordHasher.HashPassword(
                user, dto.NewPassword);

            user.MustChangePassword = false;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return true;
        }



        public async Task<bool> UpdateOwnProfileAsync(
            int userId,
            UpdateOwnProfileDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return false;

            var loginId = dto.LoginId.Trim();

            if (string.IsNullOrWhiteSpace(loginId))
                throw new ArgumentException("Login ID is required.");

            var loginIdExists = await _userRepository.GetQueryable()
                .AnyAsync(u => u.Id != userId && u.LoginId == loginId);

            if (loginIdExists)
                throw new ArgumentException("Login ID is already taken.");

            user.LoginId = loginId;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return true;
        }

        private async Task<int?> GetUserSchoolIdAsync(User user)
        {
            if (user.Role == UserRole.Director)
            {
                return await _schoolRepository.GetQueryable()
                    .Where(s => s.DirectorUserId == user.Id)
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync();
            }

            if (user.Role == UserRole.Student)
            {
                return await _studentRepository.GetQueryable()
                    .Where(s => s.UserId == user.Id)
                    .Select(s => (int?)s.SchoolId)
                    .FirstOrDefaultAsync();
            }

            if (user.Role == UserRole.Professor)
            {
                return await _professorRepository.GetQueryable()
                    .Where(p => p.UserId == user.Id)
                    .Select(p => (int?)p.SchoolId)
                    .FirstOrDefaultAsync();
            }

            return null;
        }

        private async Task<bool> CanDirectorManageUserAsync(
            User director,
            User targetUser)
        {
            if (director.Role != UserRole.Director)
                return false;

            // Directors cannot manage other Directors or Presidents.
            if (targetUser.Role == UserRole.Director ||
                targetUser.Role == UserRole.President)
                return false;

            var directorSchoolId = await GetUserSchoolIdAsync(director);
            var targetSchoolId = await GetUserSchoolIdAsync(targetUser);

            return directorSchoolId.HasValue &&
                   targetSchoolId.HasValue &&
                   directorSchoolId.Value == targetSchoolId.Value;
        }

    }
}
