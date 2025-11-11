using server.Controllers;

namespace server.DTOs;

public class VolumeDataDto
{
    public int[] Dimensions { get; }
    public double[] VoxelSpacing { get; }
    public byte[] VoxelData { get; }

    public VolumeDataDto(int[] dimensions, double[] voxelSpacing, byte[] voxelData)
    {
        Dimensions = dimensions;
        VoxelSpacing = voxelSpacing;
        VoxelData = voxelData;
    }
}