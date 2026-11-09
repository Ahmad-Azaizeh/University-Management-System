using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Courses
{
    public class UpdateCourseDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int SchoolId { get; set; }
        public int? ProfessorId { get; set; }
    }
}
