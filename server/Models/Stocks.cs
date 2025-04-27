using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

// Stock object that will be mapped to a relation in a database
// In O/RM defines how C# classes correspond to database tables and how their properties map to table columns
// Takes our classes and turn them into objects
// Like JSON
public class Stock {
    public int Id { get; set; }

    public string Symbol { get; set; } = string.Empty;

    public string CompanyName { get; set; } = string.Empty;
    
    /*  
        [...] Denotes a metadata attribute
        Attributes provide metadata (data about data) to .net about the code element it is attached to
        Acts like instructions or configurations that influence how code is treated
        
        [ Column(...) ] using the column attribute
        This attribute comes from the System.ComponentModel.DataAnnotations.Schema namespace
        Used to specifically configure how a property in my Stock model should be mapped to a column in my database
        This database will be interacted by the EF Core which again is just an object relational mapper

        (TypeName = ...) a param in the column attribute that sets database column type

        "decimal(18, 2) map the Purchase property to a database column with those characteristics
        data base will be of type decimal 18 is max # of digits stored left and write, only 2 digits after decimal
        
        The data it's providing data about is the purchase property
        It provides additional data to the Entity Framework Core Object/Relational Mapper
        about how the purchase property should be handled when it interacts with the database
    */
    [Column(TypeName = "decimal(18, 2)")]
    public decimal Purchase {get; set;}

    [Column(TypeName = "decimal(18, 2)")]
    public decimal LastDiv {get; set;}

    public string Industry {get; set;} = string.Empty;

    public long MarketCap {get; set;}

    public List<Comments> Comments{get; set;} = new List<Comments>();
}