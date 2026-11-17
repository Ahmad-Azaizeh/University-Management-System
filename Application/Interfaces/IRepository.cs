using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;

namespace UMS.Application.Interfaces
{
    public interface IRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync(params string[] includes);

        Task<(IEnumerable<T> Items, int TotalCount)> GetPagedAsync(
            int pageNumber, int pageSize, Expression<Func<T, bool>>? filter = null, params string[] includes);

        IQueryable<T> GetQueryable(params string[] includes);
        Task<T?> GetByIdAsync(int id);
        Task AddAsync(T entity);
        void Update(T entity);
        void Delete(T entity);
        Task SaveChangesAsync();
    }
}
