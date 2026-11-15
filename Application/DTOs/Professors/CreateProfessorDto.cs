using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace UMS.Application.DTOs.Professors
{
    public class CreateProfessorDto
    {
        [Required(ErrorMessage = "UserId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid user.")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "EmployeeNumber is required.")]
        [StringLength(30, MinimumLength = 3, ErrorMessage = "Employee number must be between 3 and 30 characters.")]
        public string EmployeeNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "SchoolId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid school.")]
        public int SchoolId { get; set; }
    }
}
