using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace UMS.Application.DTOs.Schools
{
    public class UpdateSchoolDto
    {
        [Required(ErrorMessage = "School name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "School name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "DirectorId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid director.")]
        public int DirectorUserId { get; set; }
    }
}
