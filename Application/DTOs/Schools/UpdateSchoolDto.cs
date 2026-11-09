using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Application.DTOs.Schools
{
    public class UpdateSchoolDto
    {
        public string Name { get; set; } = string.Empty;
        public int DirectorUserId { get; set; }
    }
}
