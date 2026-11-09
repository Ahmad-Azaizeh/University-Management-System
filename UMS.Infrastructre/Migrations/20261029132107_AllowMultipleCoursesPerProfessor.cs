using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UMS.Infrastructre.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleCoursesPerProfessor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Courses_ProfessorId",
                table: "Courses");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_ProfessorId",
                table: "Courses",
                column: "ProfessorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Courses_ProfessorId",
                table: "Courses");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_ProfessorId",
                table: "Courses",
                column: "ProfessorId",
                unique: true,
                filter: "[ProfessorId] IS NOT NULL");
        }
    }
}
