using System;
using System.Collections.Generic;
using System.Text;
using UMS.Domain.Enums;

namespace UMS.Application.DTOs.Enrollments
{
    public class CourseStudentDto
    {
        public int EnrollmentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public decimal? Grade { get; set; }
        public EnrollmentStatus Status { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
