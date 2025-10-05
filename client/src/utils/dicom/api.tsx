import Axios from "axios";
import { API_URL } from '../../constants/api';

export interface Dicom {

}

export const uploadDicom = async () => {
    try {
        console.log('Uploading Dicom...');
        const response = await Axios.post(`${API_URL}/server/dicom/process`);
        console.log('Response: ', response.data)
        return response.data;
    } catch(error: any) {
        console.error('Error Uploading Dicom:', error);
    }
}