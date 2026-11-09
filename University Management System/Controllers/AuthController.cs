using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UMS.Application.DTOs.Auth;
using UMS.Application.Interfaces.Services;

namespace University_Management_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (result == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid login ID or password."
                });
            }

            return Ok(result);
        }
    }
}
