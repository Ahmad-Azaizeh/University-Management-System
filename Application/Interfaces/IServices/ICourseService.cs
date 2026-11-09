using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Courses;

namespace UMS.Application.Interfaces.Services
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseDto>> GetAllAsync(int currentUserId);
        Task<CourseDto?> GetByIdAsync(int id, int currentUserId);
        Task<CourseDto> CreateAsync(CreateCourseDto dto, int currentUserId);
        Task<bool> UpdateAsync(int id, UpdateCourseDto dto, int currentUserId);
        Task<bool> DeleteAsync(int id, int currentUserId);
    }
}
