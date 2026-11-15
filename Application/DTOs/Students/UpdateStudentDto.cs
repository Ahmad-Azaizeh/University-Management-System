using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace UMS.Application.DTOs.Students
{
    public class UpdateStudentDto
    {

        [Required(ErrorMessage = "SchoolId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid school.")]
        public int SchoolId { get; set; }

    }
}
