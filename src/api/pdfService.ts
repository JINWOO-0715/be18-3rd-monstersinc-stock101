import apiClient from '@/api';

export const PDFUpload = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/api/disclosure/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        });

        return {
            message: response.data.message,
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ 업로드 실패:', error);
        throw error;
    }
};