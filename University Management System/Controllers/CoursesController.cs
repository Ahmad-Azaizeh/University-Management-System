
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UMS.Application.DTOs.Courses;
using UMS.Application.Interfaces.Services;

namespace University_Management_System.Controllers
{
    [Authorize(Policy = "PasswordChanged")]
    [Route("api/[controller]")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CoursesController(ICourseService courseService)
        {
            _courseService = courseService;
        }


        [Authorize(Roles = "President,Director,Professor,Student")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetAll()
        {
            try
            {
                var courses = await _courseService.GetAllAsync(
                    GetCurrentUserId());

                return Ok(courses);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President,Director,Professor,Student")]
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDto>> GetById(int id)
        {
            try
            {
                var course = await _courseService.GetByIdAsync(
                    id, GetCurrentUserId());

                if (course == null)
                    return NotFound();

                return Ok(course);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "President,Director")]
        [HttpPost]
        public async Task<ActionResult<CourseDto>> Create(CreateCourseDto dto)
        {
            try
            {
                var course = await _courseService.CreateAsync(
                    dto, GetCurrentUserId());

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = course.Id },
                    course);
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
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateCourseDto dto)
        {
            try
            {
                var updated = await _courseService.UpdateAsync(
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

        [Authorize(Roles = "President,Director")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _courseService.DeleteAsync(
                    id, GetCurrentUserId());

                if (!deleted)
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


        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userId, out var id))
                throw new UnauthorizedAccessException("Invalid user ID.");

            return id;
        }
    }
}
