namespace server.Models;

public class Comments {
    public int Id { get; set;}
    public string Title { get; set;} = string.Empty;
    public string Content { get; set;} = string.Empty;
    public DateTime CreatedOn { get; set;} = DateTime.Now;

    // Saying that stockId is optional, may or may not have a value
    public int? StockId { get; set; }
    // Navigation Property
    // Allows us to access the stock it's referenced to
    public Stock? Stock { get; set; }
}