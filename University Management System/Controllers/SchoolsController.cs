using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UMS.Application.DTOs.Schools;
using UMS.Application.Interfaces.Services;

namespace University_Management_System.Controllers
{
    [Authorize(Policy = "PasswordChanged")]
    [Route("api/[controller]")]
    [ApiController]
    public class SchoolsController : ControllerBase
    {
        private readonly ISchoolService _schoolService;

        public SchoolsController(ISchoolService schoolService)
        {
            _schoolService = schoolService;
        }


        [Authorize(Roles = "President")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SchoolDto>>> GetAll()
        {
            var schools = await _schoolService.GetAllAsync();
            return Ok(schools);
        }


        [Authorize(Roles = "President")]
        [HttpGet("{id}")]
        public async Task<ActionResult<SchoolDto>> GetById(int id)
        {
            var school = await _schoolService.GetByIdAsync(id);
            if (school == null) return NotFound();
            
            return Ok(school);
        }


        [Authorize(Roles = "President")]
        [HttpPost]
        public async Task<ActionResult<SchoolDto>> Create(CreateSchoolDto dto)
        {
            try
            {
                var school = await _schoolService.CreateAsync(dto);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = school.Id },
                    school);
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


        [Authorize(Roles = "President")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateSchoolDto dto)
        {
            try
            {
                var updated = await _schoolService.UpdateAsync(id, dto);
                if (!updated) return NotFound();

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


        [Authorize(Roles = "President")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _schoolService.DeleteAsync(id);

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
    }
}



    
