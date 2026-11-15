using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;
using UMS.Domain.Enums;

namespace UMS.Application.DTOs.Users
{
    public class CreateUserDto
    {

        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters.")]
        public string FullName { get; set; } = string.Empty;


        [Required(ErrorMessage = "LoginId is required.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "LoginId must be between 3 and 100 characters.")]
        public string LoginId { get; set; } = string.Empty;


        [Required(ErrorMessage = "Password is required.")]
        [MinLength(4, ErrorMessage = "Password must be at least 4 characters long.")]
        public string Password { get; set; } = string.Empty;


        [Required(ErrorMessage = "Role is required.")]
        [EnumDataType(typeof(UserRole))]
        public UserRole Role { get; set; }


        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid school.")]
        public int? SchoolId { get; set; }


        [StringLength(30, ErrorMessage = "Employee number cannot exceed 30 characters.")]
        public string? EmployeeNumber { get; set; }


        [StringLength(30, ErrorMessage = "Student number cannot exceed 30 characters.")]
        public string? StudentNumber { get; set; }
    }
}
