using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UMS.Infrastructre.Migrations
{
    /// <inheritdoc />
    public partial class columnNameChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DecisionByUserId",
                table: "Enrollments",
                newName: "DecidedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DecidedByUserId",
                table: "Enrollments",
                newName: "DecisionByUserId");
        }
    }
}
