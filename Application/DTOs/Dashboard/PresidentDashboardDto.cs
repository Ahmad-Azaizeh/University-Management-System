using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Dashboard
{
    public class PresidentDashboardDto
    {
        public int TotalSchools { get; set; }
        public int TotalDirectors { get; set; }
        public int TotalProfessors { get; set; }
        public int TotalStudents { get; set; }
        public double AverageGrade { get; set; }
    }
}
