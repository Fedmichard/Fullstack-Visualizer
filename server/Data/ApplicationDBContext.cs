using Microsoft.EntityFrameworkCore;

/*
    In EF Core the model namespace represents all of our models aka that will map to our database after being turned into objects
    This model namespace has a set of these entity classes which each represent a relation in a database and all it's properties (cols)
    In EF Core you must also have a context class that represents the entire database
    This is the context class
    Giant class that allows you to search your individual tables

    The EF Core's role is to take the models (blueprint/definitions and mapping configs)
    Creates a database schema, EF Core will generate all the SQL code to create tables, cols, relationships, and constraints
    Executes queries to create instances(objects of your model classes)
*/
namespace api.Data {
    // First we are taking our applicaiton db context and inheriting from DbContext
    public class ApplicationDBContext : DbContext {
        // Create a constructor
        // A base is equivalent to typing out : DbContext() but we can't in a constructor
        // : base(dbContext) allows us to pass dbContextOptions up to the inherited DbContext of our class
        public ApplicationDBContext(DbContextOptions dbContextOptions) : base(dbContextOptions) {

        }

        // Now we must add our tables
    }
}