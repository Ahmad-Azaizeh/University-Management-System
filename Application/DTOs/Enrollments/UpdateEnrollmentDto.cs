using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace UMS.Application.DTOs.Enrollments
{
    public class UpdateEnrollmentDto
    {
        [Required(ErrorMessage = "Grade is required.")]
        [Range(0, 100, ErrorMessage = "Grade must be between 0 and 100.")]
        public decimal? Grade { get; set; }
    }
}
