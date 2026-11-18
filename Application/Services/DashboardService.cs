using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Dashboard;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.IServices;
using UMS.Domain.Entities;
using UMS.Domain.Enums;

namespace UMS.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<Student> _studentRepository;
        private readonly IRepository<Professor> _professorRepository;
        private readonly IRepository<School> _schoolRepository;
        private readonly IRepository<Course> _courseRepository;
        private readonly IRepository<Enrollment> _enrollmentRepository;

        public DashboardService(
            IRepository<User> userRepository, 
            IRepository<Student> studentRepository, 
            IRepository<Professor> professorRepository, 
            IRepository<School> schoolRepository, 
            IRepository<Course> courseRepository, 
            IRepository<Enrollment> enrollmentRepository)
        {
            _userRepository = userRepository;
            _studentRepository = studentRepository;
            _professorRepository = professorRepository;
            _schoolRepository = schoolRepository;
            _courseRepository = courseRepository;
            _enrollmentRepository = enrollmentRepository;
        }


        public async Task<PresidentDashboardDto> GetPresidentDashboardAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.President)
                throw new UnauthorizedAccessException("You are not allowed to view this dashboard.");

            var dto = new PresidentDashboardDto
            {
                TotalSchools = await _schoolRepository.GetQueryable().CountAsync(),

                TotalDirectors = await _userRepository.GetQueryable().CountAsync(u => u.Role == UserRole.Director),

                TotalStudents = await _studentRepository.GetQueryable().CountAsync(),

                TotalProfessors = await _professorRepository.GetQueryable().CountAsync(),

                AverageGrade = Math.Round(
                    (double)(await _enrollmentRepository.GetQueryable()
                    .Where(e => e.Grade.HasValue)
                    .AverageAsync(e => (decimal?)e.Grade) ?? 0), 2)
            };

            return dto;
        }


        public async Task<DirectorDashboardDto> GetDirectorDashboardAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.Director)
                throw new UnauthorizedAccessException("You are not allowed to view this dashboard.");

            var school = await _schoolRepository.GetQueryable()
                .FirstOrDefaultAsync(s => s.DirectorUserId == currentUserId);

            if (school == null)
                throw new UnauthorizedAccessException("No school assigned to this Director.");

            var dto = new DirectorDashboardDto
            {
                SchoolName = school.Name,

                TotalStudents = await _studentRepository.GetQueryable().CountAsync(s => s.SchoolId == school.Id),

                TotalProfessors = await _professorRepository.GetQueryable().CountAsync(p => p.SchoolId == school.Id),

                TotalCourses = await _courseRepository.GetQueryable().CountAsync(c => c.SchoolId == school.Id),

                TotalEnrollments = await _enrollmentRepository.GetQueryable().CountAsync(e => e.Student.SchoolId == school.Id),

                AverageGrade = Math.Round(
                    (double)(await _enrollmentRepository.GetQueryable()
                    .Where(e => e.Student.SchoolId == school.Id && e.Grade.HasValue)
                    .AverageAsync(e => (decimal?)e.Grade) ?? 0), 2)
            };

            return dto;
        }


        public async Task<ProfessorDashboardDto> GetProfessorDashboardAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.Professor)
                throw new UnauthorizedAccessException("You are not allowed to view this dashboard.");

            var professor = await _professorRepository.GetQueryable().FirstOrDefaultAsync(p => p.UserId == currentUserId);

            if (professor == null)
                throw new UnauthorizedAccessException("Professor profile not found.");

            var courses = _courseRepository.GetQueryable().Where(c => c.ProfessorId == professor.Id);

            var dto = new ProfessorDashboardDto
            {
                TotalCourses = await courses.CountAsync(),

                TotalStudents = await _enrollmentRepository.GetQueryable()
                    .Where(e => e.Course.ProfessorId == professor.Id)
                    .Select(e => e.StudentId)
                    .Distinct().CountAsync(),

                AverageGrade = Math.Round(
                    (double)(await _enrollmentRepository.GetQueryable()
                    .Where(e => e.Course.ProfessorId == professor.Id && e.Grade.HasValue)
                    .AverageAsync(e => (decimal?)e.Grade) ?? 0), 2)
            };

            return dto;
        }


        public async Task<StudentDashboardDto> GetStudentDashboardAsync(int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);

            if (user == null)
                throw new UnauthorizedAccessException("User not found.");

            if (user.Role != UserRole.Student)
                throw new UnauthorizedAccessException("You are not allowed to view this dashboard.");

            var student = await _studentRepository.GetQueryable()
                .FirstOrDefaultAsync(s => s.UserId == currentUserId);

            if (student == null)
                throw new UnauthorizedAccessException("Student profile not found.");

            var enrollments = _enrollmentRepository.GetQueryable()
                .Where(e => e.StudentId == student.Id);

            var dto = new StudentDashboardDto
            {
                TotalEnrollments = await enrollments.CountAsync(),

                ApprovedEnrollments = await enrollments.CountAsync(e => e.Status == EnrollmentStatus.Approved),

                PendingEnrollments = await enrollments.CountAsync(e => e.Status == EnrollmentStatus.Pending),

                CompletedEnrollments = await enrollments.CountAsync(e => e.Status == EnrollmentStatus.Completed),

                DeclinedEnrollments = await enrollments.CountAsync(e => e.Status == EnrollmentStatus.Declined),

                FailedEnrollments = await enrollments.CountAsync(e => e.Status == EnrollmentStatus.Failed),

                AverageGrade = Math.Round(
                    (double)(await enrollments
                    .Where(e => e.Grade.HasValue)
                    .AverageAsync(e => (decimal?)e.Grade) ?? 0), 2)
            };

            return dto;
        }
    }
}
