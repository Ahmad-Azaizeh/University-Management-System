using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Schools;

namespace UMS.Application.Interfaces.Services
{
    public interface ISchoolService
    {
        Task<IEnumerable<SchoolDto>> GetAllAsync();

        Task<SchoolDto?> GetByIdAsync(int id);

        Task<SchoolDto> CreateAsync(CreateSchoolDto dto);

        Task<bool> UpdateAsync(int id, UpdateSchoolDto dto);

        Task<bool> DeleteAsync(int id);
    }
}
