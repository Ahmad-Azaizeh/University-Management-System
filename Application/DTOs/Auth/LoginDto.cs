using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Auth
{
    public class LoginDto
    {
        public string LoginId { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
