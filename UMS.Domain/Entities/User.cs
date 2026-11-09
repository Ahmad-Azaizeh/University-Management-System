using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;
using UMS.Domain.Enums;

namespace UMS.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
       

        [Display(Name = "Full Name")]
        public string FullName { get; set; } = string.Empty;
        public string LoginId { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public bool MustChangePassword { get; set; } = true;


        //--Nav--//
        public Student? Student { get; set; }
        public Professor? Professor { get; set; }
        public School? DirectedSchool { get; set; }

    }
}
