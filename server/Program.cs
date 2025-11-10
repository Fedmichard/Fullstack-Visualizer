using server.Data;
using Microsoft.EntityFrameworkCore;

// Used to configure  
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add controllers to our builder
builder.Services.AddControllers();

// After we crated our ServerContext we now need to add our context to our application
// ServerContext is the heart of our interaction and represents our db and it'll interact with EFC(O/RM)
// Set connection in app settings json
builder.Services.AddDbContext<ServerContext>(options => 
    // first setting for our db context is connecting to our database
    // Essentially telling our data base context to use postgres
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "myAllowSpecificOrigins",
        policy =>
        {
            // This policy allows your React app to make requests
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// everything below builder.build is considered middleware
// defines how http requests flows through app
// flows through each middleware in order
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(); // checks if request is for swagger
    app.UseSwaggerUI(); // checks if request is for swagger ui
}

app.UseHttpsRedirection(); // checks if request is http and chanes to https

app.UseCors("myAllowSpecificOrigins");

// Map api endpoints
app.MapControllers();

app.Run();
