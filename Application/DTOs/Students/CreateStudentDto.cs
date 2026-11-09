using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Students
{
    public class CreateStudentDto
    {
        public int UserId { get; set; }
        public string StudentNumber { get; set; } = string.Empty;
        public int SchoolId { get; set; }
    }
}
