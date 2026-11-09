using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Auth;

namespace UMS.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResultDto> LoginAsync(LoginDto dto);
    }
}
