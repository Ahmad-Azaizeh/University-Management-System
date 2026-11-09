using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Domain.Entities
{
    public class Professor
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public int SchoolId { get; set; }



        //--Nav--//
        public User User { get; set; } = null!;
        public School School { get; set; } = null!;
        public ICollection<Course> Courses { get; set; } = new List<Course>();
    }
}
