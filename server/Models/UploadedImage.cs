using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

public class UploadedImage {
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
}