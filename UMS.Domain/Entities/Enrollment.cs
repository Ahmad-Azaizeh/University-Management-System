using System;
using System.Collections.Generic;
using System.Text;
using UMS.Domain.Enums;

namespace UMS.Domain.Entities
{
    public class Enrollment
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public decimal? Grade { get; set; }
        public DateTime EnrollmentDate { get; set; } 
        public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
        public DateTime? DecisionDate { get; set; }
        public int? DecidedByUserId { get; set; }
        public DateTime? CompletedAt { get; set; }

        //--Nav--//

        public Student Student { get; set; } = null!;
        public Course Course { get; set; } = null!;
    }
}
