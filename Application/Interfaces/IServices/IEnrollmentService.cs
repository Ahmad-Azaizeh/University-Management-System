using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Enrollments;

namespace UMS.Application.Interfaces.Services
{
    public interface IEnrollmentService
    {
        Task<IEnumerable<EnrollmentDto>> GetAllAsync(int currentUserId);
        Task<EnrollmentDto?> GetByIdAsync(int id, int currentUserId);
        Task<EnrollmentDto> CreateAsync(CreateEnrollmentDto dto, int currentUserId);
        Task<bool> UpdateAsync(int id, UpdateEnrollmentDto dto, int currentUserId);

        Task<IEnumerable<CourseStudentDto>> GetStudentsByCourseAsync(int courseId, int currentUserId);

        Task<IEnumerable<EnrollmentDto>> GetMyEnrollmentsAsync(int currentUserId);
        Task<EnrollmentDto> RequestEnrollmentAsync(RequestEnrollmentDto dto, int currentUserId);
        Task<bool> ApproveRequestAsync(int enrollmentId, int currentUserId);
        Task<bool> DeclineRequestAsync(int enrollmentId, int currentUserId);
    }
}
