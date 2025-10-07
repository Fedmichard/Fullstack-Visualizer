using server.Data;
using Microsoft.AspNetCore.Mvc;

namespace server.Controllers;

[Route("server/dicom")]
[ApiController]
public class DicomController : ControllerBase {

    private readonly ServerContext _context;

    public DicomController(ServerContext context) {
        _context = context;
    }

    // Action is just a method when you submit a request to the backend that'll run in a controller
    // ActionResult is the result of that action
    // It’s what tells ASP.NET Core how to generate the HTTP response
    [HttpPost("process")]
    public IActionResult ProcessDicom() {
        return Content("Processing DICOM...");
    }
    
}