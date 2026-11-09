using System;
using System.Collections.Generic;
using System.Text;

namespace UMS.Domain.Entities
{
    public class School
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DirectorUserId { get; set; }


        //--Nav--//
        public User Director { get; set; } = null!;
        public ICollection<Student> Students { get; set; } = new List<Student>();
        public ICollection<Professor> Professors { get; set; } = new List<Professor>();
        public ICollection<Course> Courses { get; set; } = new List<Course>();
        
    }
}
