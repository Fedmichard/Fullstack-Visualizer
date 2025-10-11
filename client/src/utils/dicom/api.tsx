import Axios from "axios";
import { API_URL } from '../../constants/api';

export interface Dicom {

}

/**
 * function to upload and process dicom file
 * @param file our list of dicom files that we will be uploading
 * @returns volume data from fo-dicom
 */
export const uploadDicom = async (file: FileList) => {
    try {
        console.log('Uploading Dicom...');

        const formData = new FormData();
        for (let i = 0; i < file.length; i++) {
            formData.append('dicomFile', file[i])
        }

        console.log('Sending file to backend...')
        const response = await Axios.post(`${API_URL}/server/dicom/process`,
            formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
        });
        
        console.log('Response: ', response.data)

        return response.data;
    } catch(error: any) {
        console.error('Error Uploading Dicom:', error);
        throw error;
    }
}