using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Professors
{
    public class ProfessorDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string EmployeeNumber { get; set; } = string.Empty;
        public int SchoolId { get; set; }
        public string SchoolName { get; set; } = string.Empty;
        public int CourseCount { get; set; }
    }
}
