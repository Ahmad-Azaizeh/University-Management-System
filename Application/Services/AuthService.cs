using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UMS.Application.DTOs.Auth;
using UMS.Application.Interfaces;
using UMS.Application.Interfaces.Services;
using UMS.Domain.Entities;

namespace UMS.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _configuration;

        public AuthService(IRepository<User> userRepository,
            IPasswordHasher<User> passwordHasher,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
        }


        public async Task<AuthResultDto> LoginAsync(LoginDto dto)
        {
            var users = await _userRepository.GetAllAsync();

            var user = users.FirstOrDefault(u =>
                string.Equals(
                    u.LoginId,
                    dto.LoginId.Trim(),
                    StringComparison.OrdinalIgnoreCase));

            if (user == null)
                return null;

            var verificationResult = _passwordHasher.VerifyHashedPassword(user,
                user.PasswordHash,
                dto.Password);

            if (verificationResult == PasswordVerificationResult.Failed)
                return null;

            var jwtSection = _configuration.GetSection("Jwt");

            var key = jwtSection["Key"]
                ?? throw new InvalidOperationException("JWT Key is missing.");

            var issuer = jwtSection["Issuer"]
                ?? throw new InvalidOperationException("JWT Issuer is missing.");

            var audience = jwtSection["Audience"]
                ?? throw new InvalidOperationException("JWT Audience is missing.");

            var expiryMinutes = int.Parse(
                jwtSection["ExpiryMinutes"] ?? "60");

            var expiresAtUtc = DateTime.UtcNow.AddMinutes(expiryMinutes);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.LoginId),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("MustChangePassword", user.MustChangePassword.ToString())
            };

            var signingKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key));

            var credentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: credentials);

            var tokenString = new JwtSecurityTokenHandler()
                .WriteToken(token);

            return new AuthResultDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                LoginId = user.LoginId,
                Role = user.Role.ToString(),
                MustChangePassword = user.MustChangePassword,
                Token = tokenString,
                ExpiresAtUtc = expiresAtUtc
            };
        }
    }
}
