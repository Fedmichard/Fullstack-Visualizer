using server.Data;
using Microsoft.AspNetCore.Mvc;

namespace server.Controllers;

/*
    This is an attribute of our controller class
    provides metadata to .NET, this defines base URL for all our actions (methods)
    [ApiController] is another attribute that applies API-specific conventions to your controller
*/
[Route("server/user")]
[ApiController]
public class UserController : ControllerBase {
    /*
        Makes our classes Database Context private so it can only be accessed within this class and make it readonly
        It can be assigned a value in our constructor and can't be changed again after that
        Try to always use _namingConvention for private member variables in our class
    */
    private readonly ServerContext _context;
    
    /*
        Essentially just a setter function for our server context
        Our primary focus is to receive a database context and setting our private member equal to it
        This process is called dependency injection (DI), where a class receives its dependencies from an external source
    */
    public UserController(ServerContext context) { 
        _context = context;
    }

    // Get is the same thing as read
    // A get all function
    [HttpGet]
    public IActionResult GetAll() {
        /*
            var abstracts return type I think
            ToList is deferred execution
            this query isn't executed when declared, it is executed when the query object is iterated over a loop
            In immediate execution the query is executed when it is declared
        */
        var stocks = _context.Stocks.ToList();

        return Ok(stocks);
    }

    // Dotnet is going to use something called model binding that extracts our string id as a string
    // Turn it into an int, then pass it to the body of our function
    [HttpGet("{id}")]
    public IActionResult GetById([FromRoute] int id) {
        var stock = _context.Stocks.Find(id);

        if (stock == null) {
            // Returns the not found http status code (404)
            return NotFound();
        }

        return Ok(stock);
    }
}