using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Schools
{
    public class CreateSchoolDto
    {
        public string Name { get; set; } = string.Empty;
        public int DirectorUserId { get; set; }
    }
}
