using System;
using System.Collections.Generic;
using System.Text;
using UMS.Application.DTOs.Dashboard;

namespace UMS.Application.Interfaces.IServices
{
    public interface IDashboardService
    {
        Task<PresidentDashboardDto> GetPresidentDashboardAsync(int currentUserId);

        Task<DirectorDashboardDto> GetDirectorDashboardAsync(int currentUserId);

        Task<ProfessorDashboardDto> GetProfessorDashboardAsync(int currentUserId);

        Task<StudentDashboardDto> GetStudentDashboardAsync(int currentUserId);
    }
}
