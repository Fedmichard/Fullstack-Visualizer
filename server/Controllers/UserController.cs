using System;
using server.Models;
using server.Data;
using Microsoft.AspNetCore.Mvc;

namespace server.Controllers;

[Route("server/user")]
[ApiController]
public class UserController : ControllerBase {
    private readonly ServerContext _context;
    public UserController(ServerContext context) { 

    }
}