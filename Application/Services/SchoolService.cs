using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Schools;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;
using UMS.Domain.Enums;

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


            var schools = await _schoolRepository.GetAllAsync();
            if (schools.Any(s => s.DirectorUserId == dto.DirectorUserId))
            {
                throw new ArgumentException(
                    "This director is already assigned to a school.");
            }

            if (schools.Any(s => s.Name == dto.Name))
            {
                throw new ArgumentException("A school with this name already exists");
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

            var schools = await _schoolRepository.GetAllAsync();

            if (schools.Any(s => s.DirectorUserId == dto.DirectorUserId && s.Id != id))
            {
                throw new ArgumentException(
                    "This director is already assigned to another school.");
            }

            if (schools.Any(s => s.Name == dto.Name && s.Id != id))
            {
                throw new ArgumentException("A school with the this name already exists");
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

            var students = await _studentRepository.GetAllAsync();
            var professors = await _professorRepository.GetAllAsync();
            var courses = await _courseRepository.GetAllAsync();

            if (students.Any(s => s.SchoolId == id))
                throw new ArgumentException(
                    "Cannot delete a school that has students.");

            if (professors.Any(p => p.SchoolId == id))
                throw new ArgumentException(
                    "Cannot delete a school that has professors.");

            if (courses.Any(c => c.SchoolId == id))
                throw new ArgumentException(
                    "Cannot delete a school that has courses.");

            _schoolRepository.Delete(school);
            await _schoolRepository.SaveChangesAsync();

            return true;
        }
    }
}
