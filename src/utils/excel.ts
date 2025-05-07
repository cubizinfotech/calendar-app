
import * as XLSX from 'xlsx';

export const readExcelFile = (file: File, sheetType: number): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[sheetType];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      resolve(jsonData as any[]);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const convertExcelDateOnly = (serial: number): string => {
  // Excel date to Unix timestamp (in days)
  const utc_days = Math.floor(serial - 25569); // 25569 = days between 1899-12-30 and 1970-01-01
  const utc_value = utc_days * 86400; // seconds since Unix epoch

  // Create date in UTC
  const date_info = new Date(utc_value * 1000);

  // Format date part
  const year = date_info.getUTCFullYear();
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date_info.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const convertExcelTimeOnly = (excelValue: any) => {
  if (typeof excelValue === 'number') {
    const totalSeconds = Math.round(excelValue * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  if (typeof excelValue === 'string') {
    // Handle "9 PM" or "9:45 AM" etc
    const date = new Date(`1970-01-01T${excelValue}`);
    if (!isNaN(date.getTime())) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Try parsing manually if simple AM/PM format
    const match = excelValue.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    return null; // Cannot parse
  }
  return null;
};

export const combineDateAndTime = (dateString: string, timeString: string) => {
  return `${dateString} ${timeString}`;
};
