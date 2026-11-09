using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Users;

namespace UMS.Application.Interfaces.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(int id);
        Task<UserDto> CreateAsync(CreateUserDto dto, int currentUserId);
        Task<bool> UpdateAsync(int id, UpdateUserDto dto, int currentUserId);
        Task<bool> DeleteAsync(int id, int currentUserId);
        Task<bool> ChangePasswordAsync(int id, ChangePasswordDto dto);
        Task<bool> UpdateOwnProfileAsync(int currentUserId, UpdateOwnProfileDto dto);
    }
}
