using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Common;
using UMS.Application.DTOs.Professors;

namespace UMS.Application.Interfaces.Services
{
    public interface IProfessorService
    {
        Task<IEnumerable<ProfessorDto>> GetAllAsync(int currentUserId);

        Task<PagedResultDto<ProfessorDto>> GetAllPagedAsync(int currentUserId, int pageNumber, int pageSize, string? searchTerm = null, int? schoolId = null);

        Task<ProfessorDto?> GetByIdAsync(int id, int currentUserId);

        Task<ProfessorDto> CreateAsync(CreateProfessorDto dto, int currentUserId);

        Task<bool> UpdateAsync(int id, UpdateProfessorDto dto, int currentUserId);

        Task<bool> DeleteAsync(int id, int currentUserId);
    }
}
