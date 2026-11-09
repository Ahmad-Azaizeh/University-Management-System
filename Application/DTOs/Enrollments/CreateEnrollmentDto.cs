using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Enrollments
{
    public class CreateEnrollmentDto
    {
        public int StudentId { get; set; }
        public int CourseId { get; set; }
    }
}
