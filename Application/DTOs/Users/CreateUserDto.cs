using System;
using System.Collections.Generic;
using System.Text;
using UMS.Domain.Enums;

namespace UMS.Application.DTOs.Users
{
    public class CreateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string LoginId { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public UserRole Role { get; set; }

        public int? SchoolId { get; set; } 
        public string? EmployeeNumber { get; set; }
        public string? StudentNumber { get; set; }
    }
}
