using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace UMS.Application.DTOs.Courses
{
    public class CreateCourseDto
    {
        [Required(ErrorMessage = "Course name is required.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Course name must be between 3 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Course code is required.")]
        [StringLength(10, MinimumLength = 3, ErrorMessage = "Course code must be between 3 and 10 characters.")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "School ID is required.")]
        [Range(1, 100, ErrorMessage = "School ID must be between 1 and 100.")]
        public int SchoolId { get; set; }
        
        public int? ProfessorId { get; set; }
    }
}
