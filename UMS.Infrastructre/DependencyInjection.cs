using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UMS.Application.Interfaces;
using UMS.Infrastructure.Repositories;


namespace UMS.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, string ConnectionString)
        {
            services.AddDbContext<UMSDbContext>(options => options.UseSqlServer(ConnectionString));

            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));


            return services;
        }
    }
}
