using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.NativeInterop;
using System;
using System.Collections.Generic;
using System.Text;
using UMS.Domain.Entities;

namespace UMS.Infrastructure
{
    public class UMSDbContext : DbContext
    {
        public UMSDbContext(DbContextOptions<UMSDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<School> Schools { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Professor> Professors { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Professor - User (one-to-one)
            modelBuilder.Entity<Professor>()
                .HasOne(p => p.User)
                .WithOne(u => u.Professor)
                .HasForeignKey<Professor>(p => p.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Student - User (one-to-one)
            modelBuilder.Entity<Student>()
                .HasOne(s => s.User)
                .WithOne(u => u.Student)
                .HasForeignKey<Student>(s => s.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // School - Director User (one-to-one)
            modelBuilder.Entity<School>()
                .HasOne(s => s.Director)
                .WithOne(u => u.DirectedSchool)
                .HasForeignKey<School>(s => s.DirectorUserId)
                .OnDelete(DeleteBehavior.NoAction);

            // School - Students (one-to-many)
            modelBuilder.Entity<Student>()
                .HasOne(s => s.School)
                .WithMany(s => s.Students)
                .HasForeignKey(s => s.SchoolId)
                .OnDelete(DeleteBehavior.NoAction);

            // School - Professors (one-to-many)
            modelBuilder.Entity<Professor>()
                .HasOne(p => p.School)
                .WithMany(s => s.Professors)
                .HasForeignKey(p => p.SchoolId)
                .OnDelete(DeleteBehavior.NoAction);

            // School - Courses (one-to-many)
            modelBuilder.Entity<Course>()
                .HasOne(c => c.School)
                .WithMany(s => s.Courses)
                .HasForeignKey(c => c.SchoolId)
                .OnDelete(DeleteBehavior.NoAction);

            // Professor - Course (one-to-many)
            modelBuilder.Entity<Course>()
                .HasOne(c => c.Professor)
                .WithMany(p => p.Courses)
                .HasForeignKey(c => c.ProfessorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Student - Enrollments (one-to-many)
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Student)
                .WithMany(s => s.Enrollments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Course - Enrollments (one-to-many)
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Enrollment>()
                .Property(e => e.EnrollmentDate)
                .HasDefaultValueSql("GETDATE()");
        }


    }
}
