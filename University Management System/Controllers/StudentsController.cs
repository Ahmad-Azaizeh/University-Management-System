
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UMS.Application.DTOs.Students;
using UMS.Application.Interfaces.Services;

namespace University_Management_System.Controllers
{


    [Authorize(Policy = "PasswordChanged")]
    [Route("api/[controller]")]
    [ApiController]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentService _studentService;

        public StudentsController(IStudentService studentService)
        {
            _studentService = studentService;
        }


        [Authorize(Roles = "President,Director")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentDto>>> GetAll()
        {
            var students = await _studentService.GetAllAsync(GetCurrentUserId());
            return Ok(students);
        }



        [Authorize(Roles = "President,Director")]
        [HttpGet("{id}")]
        public async Task<ActionResult<StudentDto>> GetById(int id)
        {
            var student = await _studentService.GetByIdAsync(id, GetCurrentUserId());

            if (student == null)
                return NotFound();

            return Ok(student);
        }



        [Authorize(Roles = "President,Director")]
        [HttpPost]
        public async Task<ActionResult<StudentDto>> Create(CreateStudentDto dto)
        {
            try
            {
                var student = await _studentService.CreateAsync(dto, GetCurrentUserId());

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = student.Id },
                    student);
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
        public async Task<IActionResult> Update(int id, UpdateStudentDto dto)
        {
            try
            {
                var updated = await _studentService.UpdateAsync(
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
                var deleted = await _studentService.DeleteAsync(
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

        [Authorize(Roles = "Student")]
        [HttpGet("me")]
        public async Task<ActionResult<StudentDto>> GetMyDashboard()
        {
            try
            {
                var student = await _studentService.GetMyDashboardAsync(
                    GetCurrentUserId());

                if (student == null)
                    return NotFound(new { message = "Student profile not found." });

                return Ok(student);
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
