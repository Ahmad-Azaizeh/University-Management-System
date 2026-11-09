using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Courses
{
    public class CourseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int SchoolId { get; set; }
        public string SchoolName { get; set; } = string.Empty;
        public int? ProfessorId { get; set; }
        public string? ProfessorName { get; set; }
        public int? StudentCount { get; set; }
    }
}
