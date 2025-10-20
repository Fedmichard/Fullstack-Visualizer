using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using FellowOakDicom;
using FellowOakDicom.Imaging;
using System.Linq;
using server.Models;

namespace server.Controllers;

[Route("server/dicom")]
[ApiController]
public class DicomController : ControllerBase
{
    [HttpPost("process")]
    [RequestSizeLimit(1_000_000_000)]
    public IActionResult ProcessDicom(IFormFileCollection files)
    {
        if (files == null || files.Count == 0)
            return BadRequest("No DICOM file uploaded.");

        try
        {
            // --- 1. Load all DICOM files ---
            var parsedFiles = files
                .Select(file => DicomFile.Open(file.OpenReadStream()))
                .OrderBy(dcm => dcm.Dataset.TryGetSingleValue(DicomTag.SliceLocation, out decimal loc) ? loc : 0m)
                .ToList();

            var firstSlice = parsedFiles.First();
            int width = firstSlice.Dataset.GetSingleValueOrDefault(DicomTag.Columns, (ushort)0);
            int height = firstSlice.Dataset.GetSingleValueOrDefault(DicomTag.Rows, (ushort)0);
            int depth = parsedFiles.Count;

            if (width == 0 || height == 0)
                return BadRequest("Invalid DICOM image dimensions.");

            // --- 2. Pixel Spacing ---
            var pixelSpacing = firstSlice.Dataset.TryGetValues(DicomTag.PixelSpacing, out float[] spacing)
                ? spacing
                : new float[] { 1f, 1f }; // default if missing

            // --- 3. Compute Z Spacing ---
            float zSpacing;
            if (depth > 1)
            {
                var sliceLoc1 = firstSlice.Dataset.TryGetSingleValue(DicomTag.SliceLocation, out decimal loc1) ? loc1 : 0m;
                var sliceLoc2 = parsedFiles[1].Dataset.TryGetSingleValue(DicomTag.SliceLocation, out decimal loc2) ? loc2 : loc1;
                zSpacing = (float)Math.Abs(sliceLoc2 - sliceLoc1);
            }
            else
            {
                // Single-slice fallback
                zSpacing = firstSlice.Dataset.GetSingleValueOrDefault(DicomTag.SliceThickness, 1f);
            }

            // --- 4. Allocate full volume ---
            int sliceSize = width * height;
            int totalVoxels = sliceSize * depth;
            ushort[] fullVolumeData = new ushort[totalVoxels];

            // --- 5. Fill voxel data ---
            for (int i = 0; i < depth; i++)
            {
                var slice = parsedFiles[i];
                var pixelData = DicomPixelData.Create(slice.Dataset);
                var frame = pixelData.GetFrame(0);
                var rawBytes = frame.Data;

                // Convert from byte[] → ushort[]
                ushort[] slicePixels16 = new ushort[sliceSize];
                Buffer.BlockCopy(rawBytes, 0, slicePixels16, 0, Math.Min(rawBytes.Length, sliceSize * 2));

                // Copy into the full volume
                Array.Copy(slicePixels16, 0, fullVolumeData, i * sliceSize, sliceSize);
            }

            // --- 6. Convert to byte[] for DTO ---
            byte[] voxelDataBytes = new byte[fullVolumeData.Length * 2];
            Buffer.BlockCopy(fullVolumeData, 0, voxelDataBytes, 0, voxelDataBytes.Length);

            // --- 7. Package result ---
            var volumeDto = new VolumeDataDto(
                dimensions: new int[] { width, height, depth },
                voxelSpacing: new float[] { pixelSpacing[0], pixelSpacing[1], zSpacing },
                voxelData: voxelDataBytes
            );

            return Ok(volumeDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"An error occurred while processing DICOM: {ex.Message}");
        }
    }
}
