using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace UMS.Application.DTOs.Students
{
    public class CreateStudentDto
    {
        [Required(ErrorMessage = "UserId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid user.")]
        public int UserId { get; set; }


        [Required(ErrorMessage = "Student number is required.")]
        [StringLength(30, MinimumLength = 2, ErrorMessage = "Student number must be between 2 and 30 characters.")]
        public string StudentNumber { get; set; } = string.Empty;


        [Required(ErrorMessage = "SchoolId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid school.")]
        public int SchoolId { get; set; }
    }
}
