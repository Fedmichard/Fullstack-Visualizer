using Microsoft.EntityFrameworkCore;
using server.Models;

/*
    In EF Core the model namespace represents all of our models that will map to our database after being turned into objects
    This model namespace has a set of these entity classes which each represent a relation in a database and all it's properties (cols)
    In EF Core you must also have a context class that represents the entire database
    This is the context class
    Giant class that allows you to search your individual tables

    The EF Core's role is to take the models (blueprint/definitions and mapping configs) and turns them into objects
    Creates a database schema, EF Core will generate all the SQL code to create tables, cols, relationships, and constraints
    Executes queries to create instances(objects of your model classes)
*/
namespace server.Data;
/*
    First we are taking our application inheriting from DbContext class from EntityFrameworkCore namespace
    DbContext is the heart of my interaction with the database in entity framework core
    Think of it as a representaion of entire database, it knows all tables in database and how they relate to model classes
    It also provides a way to query data from the database, track changes to objects, and save those changes back to db
    */
public class ServerContext : DbContext {
    /*
        Create a constructor
        Automatically called when a new instance of ServerContext is created
        Configures your server context

        What is DbContextOptions?
        Holds configuration settings for your db context
        Specifies things like:
            What database provider you're connecting to (postgresql in this examp)
            Info to locate and access db server
            other configs
        
        A base is equivalent to typing out : DbContext() but we can't in a constructor
        It calls the constructor of the base() class DbContext()
        : base(dbContext) allows us to pass dbContextOptions up to the inherited DbContext of our class
        This is called constructor initialization list

        We're essentially just creating a DbContext, the DbContext class just provides a base that we can customize
        ourselves. 
        So calling the constructor for our parent class creates that parent class and all the it's variables and functions
        are available, So long as they're not private;
    */
    public ServerContext(DbContextOptions options) : base(options) {}

    /*  
        Now we must add our tables
        DbSet is a class provided by Entity Framework Core that represents a collection of all entities of a given type in the db
        So a collection of all entities with stock datatype
        And another collection of all entities with comment datatype
        These make it easy to retrieve all entities for example
    */
    public DbSet<Stock> Stocks { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UploadedImage> Image { get; set; }
}