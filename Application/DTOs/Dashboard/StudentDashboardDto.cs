using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Dashboard
{
    public class StudentDashboardDto
    {
        public int TotalEnrollments { get; set; }
        public int ApprovedEnrollments { get; set; }
        public int PendingEnrollments { get; set; }
        public int CompletedEnrollments { get; set; }
        public int DeclinedEnrollments { get; set; }
        public int FailedEnrollments { get; set; }
        public double AverageGrade { get; set; }
    }
}
