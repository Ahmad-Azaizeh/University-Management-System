using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Professors
{
    public class CreateProfessorDto
    {
        public int UserId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public int SchoolId { get; set; }
    }
}
