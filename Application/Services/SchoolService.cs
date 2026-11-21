using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using UMS.Application.DTOs.Common;
using UMS.Application.DTOs.Schools;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;
using UMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace UMS.Application.Services
{
    public class SchoolService : ISchoolService
    {
        private readonly IRepository<School> _schoolRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<Student> _studentRepository;
        private readonly IRepository<Professor> _professorRepository;
        private readonly IRepository<Course> _courseRepository;

        public SchoolService(IRepository<School> schoolRepository,
            IRepository<User> userRepository,
            IRepository<Student> studentRepository,
            IRepository<Professor> professorRepository,
            IRepository<Course> courseRepository)
        {
            _schoolRepository = schoolRepository;
            _userRepository = userRepository;
            _studentRepository = studentRepository;
            _professorRepository = professorRepository;
            _courseRepository = courseRepository;
        }


        public async Task<IEnumerable<SchoolDto>> GetAllAsync()
        {
            var schools = await _schoolRepository.GetAllAsync();
            return schools.Select(s => new SchoolDto
            {
                Id = s.Id,
                Name = s.Name,
                DirectorUserId = s.DirectorUserId
            });
        }


        public async Task<PagedResultDto<SchoolDto>> GetPagedAsync(int pageNumber, int pageSize, string? searchTerm = null)
        {
            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Clamp(pageSize, 1, 100);

            Expression<Func<School, bool>>? filter = null;

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                filter = s => s.Name.Contains(searchTerm);
            }

            var (schools, totalCount) = await _schoolRepository.GetPagedAsync(
                pageNumber, pageSize, filter);

            var items = schools.Select(s => new SchoolDto
            {
                Id = s.Id,
                Name = s.Name,
                DirectorUserId = s.DirectorUserId
            });

            return new PagedResultDto<SchoolDto>
            {
                Items = items,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }


        public async Task<SchoolDto?> GetByIdAsync(int id)
        {
            var school = await _schoolRepository.GetByIdAsync(id);
            if (school == null) return null;

            return new SchoolDto
            {
                Id = school.Id,
                Name = school.Name,
                DirectorUserId = school.DirectorUserId
            };
        }


        public async Task<SchoolDto> CreateAsync(CreateSchoolDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new ArgumentException("School name is required.");
            }


            var director = await _userRepository.GetByIdAsync(dto.DirectorUserId);
            if (director == null)
            {
                throw new ArgumentException("Director user does not exist");
            }

            if (director.Role != UserRole.Director)
            {
                throw new ArgumentException("The specified user is not a director");
            }


            var directorAlreadyAssigned = await _schoolRepository.GetQueryable()
                .AnyAsync(s => s.DirectorUserId == dto.DirectorUserId);

            if (directorAlreadyAssigned)
            {
                throw new ArgumentException(
                    "This director is already assigned to a school.");
            }

            var schoolNameExists = await _schoolRepository.GetQueryable()
                .AnyAsync(s => s.Name == dto.Name);

            if (schoolNameExists)
            {
                throw new ArgumentException(
                    "A school with this name already exists");
            }


            var school = new School
            {
                Name = dto.Name,
                DirectorUserId = dto.DirectorUserId
            };

            await _schoolRepository.AddAsync(school);
            await _schoolRepository.SaveChangesAsync();

            return new SchoolDto
            {
                Id = school.Id,
                Name = school.Name,
                DirectorUserId = school.DirectorUserId
            };
        }


        public async Task<bool> UpdateAsync(int id, UpdateSchoolDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new ArgumentException("School name is required.");
            }


            var school = await _schoolRepository.GetByIdAsync(id);
            if (school == null) return false;

            var director = await _userRepository.GetByIdAsync(dto.DirectorUserId);
            if (director == null)
            {
                throw new ArgumentException("Director user does not exist");
            }
            if(director.Role != UserRole.Director)
            {
                throw new ArgumentException("The specified user is not a director");
            }

            var directorAlreadyAssigned = await _schoolRepository.GetQueryable()
                .AnyAsync(s => s.DirectorUserId == dto.DirectorUserId && s.Id != id);

            if (directorAlreadyAssigned)
            {
                throw new ArgumentException(
                    "This director is already assigned to another school.");
            }

            var schoolNameExists = await _schoolRepository.GetQueryable()
                .AnyAsync(s => s.Name == dto.Name && s.Id != id);

            if (schoolNameExists)
            {
                throw new ArgumentException(
                    "A school with the this name already exists");
            }

            school.Name = dto.Name;
            school.DirectorUserId = dto.DirectorUserId;

            _schoolRepository.Update(school);
            await _schoolRepository.SaveChangesAsync();

            return true;
        }


        public async Task<bool> DeleteAsync(int id)
        {
            var school = await _schoolRepository.GetByIdAsync(id);

            if (school == null)
                return false;

            var hasStudents = await _studentRepository.GetQueryable()
                .AnyAsync(s => s.SchoolId == id);

            if (hasStudents)
                throw new ArgumentException(
                    "Cannot delete a school that has students.");

            var hasProfessors = await _professorRepository.GetQueryable()
                .AnyAsync(p => p.SchoolId == id);

            if (hasProfessors)
                throw new ArgumentException(
                    "Cannot delete a school that has professors.");

            var hasCourses = await _courseRepository.GetQueryable()
                .AnyAsync(c => c.SchoolId == id);

            if (hasCourses)
                throw new ArgumentException(
                    "Cannot delete a school that has courses.");

            _schoolRepository.Delete(school);
            await _schoolRepository.SaveChangesAsync();

            return true;
        }
    }
}
