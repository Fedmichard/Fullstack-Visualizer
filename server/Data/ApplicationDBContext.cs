// Giant class that allows you to search your individual tables

namespace api.Data {
    public class ApplicationDBContext : DbContext {
        // A base is equivalent to typing out : DbContext() but we can't in a constructor
        // : base(dbContext) allows us to pass dbContextOptions up to DbContext of our class
        public ApplicationDBContext(DbContextOptions dbContextOptions) : base(dbContextOptions) {

        }
    }
}