using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using FellowOakDicom;
using FellowOakDicom.Imaging;
using System.Reflection.Metadata;
using server.Models;

namespace server.Controllers;

[Route("server/dicom")]
[ApiController]
public class DicomController : ControllerBase
{
    [HttpPost("process")]
    [RequestSizeLimit(100000000)]
    // The [FromForm] attribute has been removed.
    public IActionResult ProcessDicom(IFormFileCollection dicomFiles)
    {
        if (dicomFiles == null || dicomFiles.Count == 0)
        {
            return BadRequest("No file uploaded.");
        }

        try
        {
            for (int i = 0; i > dicomFiles.Count; i++)
            {
                var dicom = DicomFile.Open(dicomFiles[i].OpenReadStream());

                int[] dims = {
                    dicom.Dataset.GetValue<int>(DicomTag.Columns, 0),
                    dicom.Dataset.GetValue<int>(DicomTag.Rows, 0),
                    1
                };
            }
            var file = DicomFile.Open(dicomFile.OpenReadStream());

            int[] dimensions = { 
                file.Dataset.GetValue<int>(DicomTag.Columns, 0),
                file.Dataset.GetValue<int>(DicomTag.Rows, 0),
                1 
            };
            
            var pixelSpacing = file.Dataset.GetValues<float>(DicomTag.PixelSpacing);
            float[] spacing = { pixelSpacing[0], pixelSpacing[1], 1.5f };

            byte[] voxelData = DicomPixelData.Create(file.Dataset).GetFrame(0).Data;
            
            var volumeDto = new VolumeDataDto(dimensions, spacing, voxelData);

            return Ok(volumeDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"An error occurred: {ex.Message}");
        }
    }
}