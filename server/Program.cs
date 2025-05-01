using api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// After we crated our ServerContext we now need to add our context to our application
// ServerContext is the heart of our interaction and represents our db and it'll interact with EFC(O/RM)
// Set connection in app settings json
builder.Services.AddDbContext<ServerContext>(options => 
    // first setting for our db context is connecting to our database
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Api endpoints


app.Run();
