using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Common;
using UMS.Application.DTOs.Students;
using UMS.Domain.Entities;

namespace UMS.Application.Interfaces.Services
{
    public interface IStudentService
    {
        Task<IEnumerable<StudentDto>> GetAllAsync(int currentUserId);

        Task<PagedResultDto<StudentDto>> GetAllPagedAsync(
            int currentUserId,
            int pageNumber,
            int pageSize,
            string? searchTerm = null,
            int? schoolId = null,
            int? courseId = null);

        Task<StudentDto?> GetByIdAsync(int id, int currentUserId);
        
        Task<StudentDto> CreateAsync(CreateStudentDto dto, int currentUserId);
        
        Task<bool> UpdateAsync(int id, UpdateStudentDto dto, int currentUserId);
        
        Task<bool> DeleteAsync(int id, int currentUserId);
        Task<StudentDto?> GetMyDashboardAsync(int currentUserId);

    }
}
