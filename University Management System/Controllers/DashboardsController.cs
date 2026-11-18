using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UMS.Application.DTOs.Dashboard;
using UMS.Application.Interfaces.IServices;

namespace University_Management_System.Controllers
{
    [Authorize(Policy = "PasswordChanged")]
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [Authorize(Roles = "President")]
        [HttpGet("president")]
        public async Task<ActionResult<PresidentDashboardDto>> GetPresidentDashboard()
        {
            try
            {
                var dashboard = await _dashboardService
                    .GetPresidentDashboardAsync(GetCurrentUserId());

                return Ok(dashboard);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Director")]
        [HttpGet("director")]
        public async Task<ActionResult<DirectorDashboardDto>> GetDirectorDashboard()
        {
            try
            {
                var dashboard = await _dashboardService
                    .GetDirectorDashboardAsync(GetCurrentUserId());

                return Ok(dashboard);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Professor")]
        [HttpGet("professor")]
        public async Task<ActionResult<ProfessorDashboardDto>> GetProfessorDashboard()
        {
            try
            {
                var dashboard = await _dashboardService
                    .GetProfessorDashboardAsync(GetCurrentUserId());

                return Ok(dashboard);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Student")]
        [HttpGet("student")]
        public async Task<ActionResult<StudentDashboardDto>> GetStudentDashboard()
        {
            try
            {
                var dashboard = await _dashboardService
                    .GetStudentDashboardAsync(GetCurrentUserId());

                return Ok(dashboard);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userId, out var id))
                throw new UnauthorizedAccessException("Invalid user ID.");

            return id;
        }
    }
}

