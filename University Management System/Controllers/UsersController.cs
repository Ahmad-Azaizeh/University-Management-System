using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UMS.Application.DTOs.Users;
using UMS.Application.Interfaces.Services;

namespace University_Management_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }


        [Authorize(Policy = "PasswordChanged")]
        [Authorize(Roles = "President")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }


        [Authorize(Policy = "PasswordChanged")]
        [Authorize(Roles = "President")]
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetById(int id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null) return NotFound();
            
            return Ok(user);
        }


        [Authorize(Policy = "PasswordChanged")]
        [Authorize(Roles = "President,Director")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateUserDto dto)
        {
            try
            {
                var result = await _userService.CreateAsync(dto, GetCurrentUserId());

                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
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


        [Authorize(Policy = "PasswordChanged")]
        [Authorize(Roles = "President,Director")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateUserDto dto)
        {
            try
            {
                var updated = await _userService.UpdateAsync(id, dto, GetCurrentUserId());

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


        [Authorize(Policy = "PasswordChanged")]
        [Authorize(Roles = "President,Director")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _userService.DeleteAsync(id, GetCurrentUserId());

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


        [Authorize]
        [HttpPut("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, ChangePasswordDto dto)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (!int.TryParse(currentUserId, out var authenticatedUserId))
                    return Unauthorized();

                if (authenticatedUserId != id)
                    return Forbid();

                var success = await _userService.ChangePasswordAsync(id, dto);

                if (!success)
                    return BadRequest(new
                    {
                        message = "Password change failed. Check your current password."
                    });

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

        [Authorize(Policy = "PasswordChanged")]
        [HttpPut("me/profile")]
        public async Task<IActionResult> UpdateOwnProfile(UpdateOwnProfileDto dto)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var updated = await _userService.UpdateOwnProfileAsync(
                    currentUserId, dto);

                if (!updated)
                    return NotFound();

                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }



        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userId, out var id))
                throw new UnauthorizedAccessException("Invalid user identity.");

            return id;
        }
    }
}
