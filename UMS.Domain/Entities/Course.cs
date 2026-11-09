using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Domain.Entities
{
    public class Course
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int SchoolId { get; set; }
        public int? ProfessorId { get; set; }


        //--Nav--//

        public School School { get; set; } = null!;
        public Professor? Professor { get; set; }
        public ICollection<Enrollment> Enrollments { get; set; }
            = new List<Enrollment>();
    }
}
