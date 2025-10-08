using server.Controllers;

namespace server.DTOs;

public class VolumeDataDto
{
    public int[] Dimensions { get; }
    public float[] VoxelSpacing { get; }
    public byte[] VoxelData { get; }

    public VolumeDataDto(int[] dimensions, float[] voxelSpacing, byte[] voxelData)
    {
        Dimensions = dimensions;
        VoxelSpacing = voxelSpacing;
        VoxelData = voxelData;
    }
}