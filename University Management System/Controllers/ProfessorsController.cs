
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UMS.Application.DTOs.Professors;
using UMS.Application.Interfaces.Services;

namespace University_Management_System.Controllers
{

    [Authorize(Policy = "PasswordChanged")]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfessorsController : ControllerBase
    {
        private readonly IProfessorService _professorService;

        public ProfessorsController(IProfessorService professorService)
        {
            _professorService = professorService;
        }

        

        [Authorize(Roles = "President,Director")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProfessorDto>>> GetAll()
        {
            try
            {
                var professors = await _professorService.GetAllAsync(
                    GetCurrentUserId());

                return Ok(professors);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }


        [Authorize(Roles = "President,Director")]
        [HttpGet("{id}")]
        public async Task<ActionResult<ProfessorDto>> GetById(int id)
        {
            try
            {
                var professor = await _professorService.GetByIdAsync(
                    id, GetCurrentUserId());

                if (professor == null)
                    return NotFound();

                return Ok(professor);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }


        [Authorize(Roles = "President,Director")]
        [HttpPost]
        public async Task<ActionResult<ProfessorDto>> Create(
            [FromBody] CreateProfessorDto dto)
        {
            try
            {
                var professor = await _professorService.CreateAsync(
                    dto, GetCurrentUserId());

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = professor.Id },
                    professor);
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
        public async Task<IActionResult> Update(
            int id, [FromBody] UpdateProfessorDto dto)
        {
            try
            {
                var updated = await _professorService.UpdateAsync(
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
                var deleted = await _professorService.DeleteAsync(
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
