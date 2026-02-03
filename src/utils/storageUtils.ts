import { set, get, del } from 'idb-keyval';

export const savePdf = async (id: string, data: string | Blob) => {
    try {
        await set(`pdf-${id}`, data);
    } catch (error) {
        console.error('Failed to save PDF:', error);
        throw error;
    }
};

export const getPdf = async (id: string): Promise<string | Blob | undefined> => {
    return await get(`pdf-${id}`);
};

export const deletePdf = async (id: string) => {
    await del(`pdf-${id}`);
};
