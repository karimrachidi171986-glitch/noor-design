import Papa from 'papaparse';

export interface STLProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  category?: string;
}

export async function fetchGoogleSheetData(sheetUrl: string): Promise<STLProduct[]> {
  try {
    const response = await fetch(sheetUrl);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const products: STLProduct[] = results.data.map((row: any, index: number) => ({
            id: row.id || `stl-${index}`,
            name: row.Name || row.name || 'Sans nom',
            description: row.Description || row.description || '',
            imageUrl: row.ImageUrl || row.imageUrl || row.Image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
            downloadUrl: row.DownloadUrl || row.downloadUrl || row.Link || '#',
            category: row.Category || row.category || 'STL',
          }));
          resolve(products);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw error;
  }
}
