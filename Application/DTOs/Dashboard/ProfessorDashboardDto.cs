using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Dashboard
{
    public class ProfessorDashboardDto
    {
        public int TotalCourses { get; set; }
        public int TotalStudents { get; set; }
        public double AverageGrade { get; set; }
    }
}
