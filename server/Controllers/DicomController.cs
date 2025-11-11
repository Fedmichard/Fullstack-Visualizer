using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using FellowOakDicom;
using FellowOakDicom.Imaging;
using System.Linq;
using System.IO;
using System.Collections.Generic;
using System;
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
        {
            return BadRequest("No DICOM file uploaded.");
        }

        try
        {
            // parsedFiles list to be filled with our dicoms
            List<DicomFile> parsedFiles = new List<DicomFile>();

            // for every single file from our uploaded files
            // turn them into dicom file objects and insert into
            // parsed files folder
            foreach (var file in files)
            {
                var dcm = DicomFile.Open(file.OpenReadStream());
                parsedFiles.Add(dcm);
            }

            // now we order our parsedFiles 
            parsedFiles.Sort((a, b) =>
            {
                decimal zA = 0m;
                decimal zB = 0m;

                // Try to get Z position for slice A
                if (a.Dataset.TryGetValues(DicomTag.ImagePositionPatient, out double[] posA) && posA.Length >= 3)
                    zA = (decimal)posA[2];
                else if (a.Dataset.TryGetSingleValue(DicomTag.SliceLocation, out decimal slA))
                    zA = slA;

                // Try to get Z position for slice B
                if (b.Dataset.TryGetValues(DicomTag.ImagePositionPatient, out double[] posB) && posB.Length >= 3)
                    zB = (decimal)posB[2];
                else if (b.Dataset.TryGetSingleValue(DicomTag.SliceLocation, out decimal slB))
                    zB = slB;

                // Sort ascending (smallest z first)
                return zA.CompareTo(zB);
            });

            var firstSlice = parsedFiles.First();
            int width = firstSlice.Dataset.GetSingleValueOrDefault(DicomTag.Columns, (ushort)0);
            int height = firstSlice.Dataset.GetSingleValueOrDefault(DicomTag.Rows, (ushort)0);
            int depth = parsedFiles.Count;

            if (width == 0 || height == 0)
            {
                return BadRequest("Invalid DICOM image dimensions.");
            }

            // --- Retrieve Pixel Spacing ---
            var pixelSpacing = firstSlice.Dataset.TryGetValues(DicomTag.PixelSpacing, out double[] spacing)
                // if it doesn't exist default x, y to 1
                ? spacing
                : new double[] { 1.0, 1.0 };

            // --- Compute Z Spacing, space between each slice ---
            double zSpacing = 1.0;

            if (depth > 1)
            {
                var first = parsedFiles[0];
                var second = parsedFiles[1];

                // Prefer ImagePositionPatient for spacing
                if (first.Dataset.TryGetValues(DicomTag.ImagePositionPatient, out double[] pos1) &&
                    second.Dataset.TryGetValues(DicomTag.ImagePositionPatient, out double[] pos2) &&
                    pos1.Length >= 3 && pos2.Length >= 3)
                {
                    zSpacing = Math.Abs(pos2[2] - pos1[2]);
                }
                else if (first.Dataset.TryGetSingleValue(DicomTag.SliceThickness, out double sliceThickness))
                {
                    // Fallback to slice thickness if no ImagePositionPatient
                    zSpacing = sliceThickness;
                }
            }
            else if (firstSlice.Dataset.TryGetSingleValue(DicomTag.SliceThickness, out double singleThickness))
            {
                zSpacing = singleThickness;
            }

            // --- Sanity check to avoid zero spacing ---
            if (zSpacing <= 0.0)
                zSpacing = 1.0;

            // --- Allocate Volume ---
            int sliceSize = width * height;
            int totalVoxels = sliceSize * depth;
            // using short since it's 16 bits for our HU values
            // we make the array the full volume size
            // and will fill it afterwards
            short[] fullVolumeData = new short[totalVoxels];

            // --- Fill voxel data ---
            for (int i = 0; i < depth; i++)
            {
                var slice = parsedFiles[i];

                // --- Process 3D Voxel Data ---
                var pixelData = DicomPixelData.Create(slice.Dataset);
                var frame = pixelData.GetFrame(0);
                var rawBytes = frame.Data;

                var slope = slice.Dataset.GetSingleValueOrDefault(DicomTag.RescaleSlope, 1.0f);
                var intercept = slice.Dataset.GetSingleValueOrDefault(DicomTag.RescaleIntercept, 0.0f);

                ushort[] slicePixels16 = new ushort[sliceSize];
                Buffer.BlockCopy(rawBytes, 0, slicePixels16, 0, Math.Min(rawBytes.Length, sliceSize * 2));

                int sliceOffset = i * sliceSize;
                for (int k = 0; k < sliceSize; k++)
                {
                    double val = slicePixels16[k] * (double)slope + (double)intercept;
                    if (val > short.MaxValue) val = short.MaxValue;
                    if (val < short.MinValue) val = short.MinValue;
                    fullVolumeData[sliceOffset + k] = (short)val;
                }
            }

            // --- Convert to byte[] for DTO ---
            byte[] voxelDataBytes = new byte[fullVolumeData.Length * 2];
            Buffer.BlockCopy(fullVolumeData, 0, voxelDataBytes, 0, voxelDataBytes.Length);

            // --- Package result ---
            var volumeDto = new VolumeDataDto(
                dimensions: new int[] { width, height, depth },
                voxelSpacing: new double[] { pixelSpacing[0], pixelSpacing[1], zSpacing },
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
