using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Students
{
    public class StudentDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public int SchoolId { get; set; }
        public string SchoolName { get; set; } = string.Empty;

        public List<StudentEnrollmentDto> Enrollments { get; set; } = new();
    }

    public class StudentEnrollmentDto
    {
        public int EnrollmentId { get; set; }
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public decimal? Grade { get; set; }
        public DateTime EnrollmentDate { get; set; }
    }

}
