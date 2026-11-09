using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UMS.Infrastructre.Migrations
{
    /// <inheritdoc />
    public partial class EnrollmentAdd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Enrollments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DecisionByUserId",
                table: "Enrollments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DecisionDate",
                table: "Enrollments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Enrollments",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "DecisionByUserId",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "DecisionDate",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Enrollments");
        }
    }
}
