using System;
using System.Collections.Generic;
using System.Text;
using UMS.Domain.Enums;

namespace UMS.Application.DTOs.Enrollments
{
    public class EnrollmentDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public DateTime EnrollmentDate { get; set; }
        public decimal? Grade { get; set; }
        public EnrollmentStatus Status { get; set; } 
        public DateTime? DecisionDate { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
