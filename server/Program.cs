// Controls things like dependancy injection
// Provide with services and things to add to program
// Almost like module
var builder = WebApplication.CreateBuilder(args); // Var tells compiler to figure out the variable type (like auto in c#)

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Your app, controls your actual http request pipeline
var app = builder.Build();

// Configure the HTTP request pipeline.
// Middleware for request and responses
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

/* DEFINE API END POINTS HERE */

app.Run();