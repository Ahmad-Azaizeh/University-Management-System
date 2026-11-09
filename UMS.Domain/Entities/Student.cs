using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Domain.Entities
{
    public class Student
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string StudentNumber { get; set; } = string.Empty;
        public int SchoolId { get; set; }


        //--Nav--//
        public User User { get; set; } = null!;
        public School School { get; set; } = null!;
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
