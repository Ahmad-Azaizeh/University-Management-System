using System;
using System.Collections.Generic;
using System.Text;
using UMS.Domain.Enums;

namespace UMS.Application.DTOs.Users
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string LoginId { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public bool MustChangePassword { get; set; }
    }
}
