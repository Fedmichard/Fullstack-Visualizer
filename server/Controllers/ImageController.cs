using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Controllers;

[Route("server/image")]
[ApiController]
public class ImageController : ControllerBase
{
    // our context that we'll use throughout our API calls
    private readonly ServerContext _context;

    // fill in our _context variable with the context provided
    public ImageController(ServerContext context)
    {
        _context = context;
    }

    [HttpPost("processImage")]
    public IActionResult processImage()
    {
        return Content("");
    }
}