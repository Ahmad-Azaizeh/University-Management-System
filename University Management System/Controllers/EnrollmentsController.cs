
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UMS.Application.DTOs.Enrollments;
using UMS.Application.Interfaces.Services;

namespace University_Management_System.Controllers
{
    [Authorize(Policy = "PasswordChanged")]
    [Route("api/[controller]")]
    [ApiController]
    public class EnrollmentsController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        public EnrollmentsController(IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userId, out var id))
                throw new UnauthorizedAccessException("Invalid user ID.");

            return id;
        }

        [Authorize(Roles = "President,Director")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetAll()
        {
            try
            {
                var enrollments = await _enrollmentService.GetAllAsync(
                    GetCurrentUserId());

                return Ok(enrollments);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President,Director")]
        [HttpGet("{id}")]
        public async Task<ActionResult<EnrollmentDto>> GetById(int id)
        {
            try
            {
                var enrollment = await _enrollmentService.GetByIdAsync(
                    id, GetCurrentUserId());

                if (enrollment == null)
                    return NotFound();

                return Ok(enrollment);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President,Director")]
        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> Create(CreateEnrollmentDto dto)
        {
            try
            {
                var enrollment = await _enrollmentService.CreateAsync(
                    dto, GetCurrentUserId());

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = enrollment.Id },
                    enrollment);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President, Director, Professor")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateEnrollmentDto dto)
        {
            try
            {
                var updated = await _enrollmentService.UpdateAsync(
                    id, dto, GetCurrentUserId());

                if (!updated)
                    return NotFound();

                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President,Director,Professor")]
        [HttpGet("course/{courseId}/students")]
        public async Task<ActionResult<IEnumerable<CourseStudentDto>>> GetStudentsByCourse(int courseId)
        {
            try
            {
                var students = await _enrollmentService.GetStudentsByCourseAsync(
                    courseId,
                    GetCurrentUserId());

                return Ok(students);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }



        [Authorize(Roles = "Student")]
        [HttpPost("request")]
        public async Task<ActionResult<EnrollmentDto>> RequestEnrollment(
            RequestEnrollmentDto dto)
        {
            try
            {
                var enrollment = await _enrollmentService.RequestEnrollmentAsync(
                    dto, GetCurrentUserId());

                return Ok(enrollment);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Student")]
        [HttpGet("me")]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetMyEnrollments()
        {
            try
            {
                var enrollments = await _enrollmentService.GetMyEnrollmentsAsync(
                    GetCurrentUserId());

                return Ok(enrollments);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President,Director")]
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveRequest(int id)
        {
            try
            {
                var approved = await _enrollmentService.ApproveRequestAsync(
                    id, GetCurrentUserId());

                if (!approved)
                    return NotFound();

                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President,Director")]
        [HttpPut("{id}/decline")]
        public async Task<IActionResult> DeclineRequest(int id)
        {
            try
            {
                var declined = await _enrollmentService.DeclineRequestAsync(
                    id, GetCurrentUserId());

                if (!declined)
                    return NotFound();

                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

    }
}
