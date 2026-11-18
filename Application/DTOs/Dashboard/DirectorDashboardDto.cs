using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Dashboard
{
    public class DirectorDashboardDto
    {
        public string SchoolName { get; set; } = string.Empty;
        public int TotalProfessors { get; set; }
        public int TotalCourses { get; set; }
        public int TotalStudents { get; set; }
        public int TotalEnrollments { get; set; }
        public double AverageGrade { get; set; }
    }
}
