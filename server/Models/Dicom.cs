namespace server.Models;

public class Dicom {
    public string Name { get; set;} = string.Empty;
    public int Dimensions { get; set; }
    public float VoxelSpacing { get; set; }
    public byte[] VoxelData { get; set;} = new byte[0];
}