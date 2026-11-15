using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace UMS.Application.DTOs.Users
{
    public class UpdateOwnProfileDto
    {
        [Required(ErrorMessage = "LoginId is required.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "LoginId must be between 3 and 100 characters.")]
        public string LoginId { get; set; } = string.Empty;
    }
}
