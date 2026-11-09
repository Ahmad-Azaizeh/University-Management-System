using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Auth
{
    public class AuthResultDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string LoginId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool MustChangePassword { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
    }
}
