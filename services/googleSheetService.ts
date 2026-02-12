
import { TimeSlot, BookingDetails, CompanyInfo } from "../types";

/**
 * [최신 설정] 제공해주신 URL을 적용했습니다.
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylT7LtlIaRYKK1D0sd98Xsc-PpujZdvJeCyq-hvnmxWucwAtIvtj8L4lEZzJaNgs83/exec";

async function apiRequest(action: string, payload?: any) {
  if (APPS_SCRIPT_URL.includes("REPLACE_WITH_YOUR_ACTUAL_URL")) {
    throw new Error("URL_NOT_CONFIGURED");
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action, ...payload }),
    });
    
    if (!response.ok) throw new Error('NETWORK_ERROR');
    return await response.json();
  } catch (error) {
    console.error(`API 통신 오류 (${action}):`, error);
    throw error;
  }
}

export const fetchSlots = async (): Promise<TimeSlot[]> => {
  const result = await apiRequest('fetchSlots');
  return result.data || [];
};

export const saveSlots = async (slots: TimeSlot[]): Promise<void> => {
  await apiRequest('saveSlots', { slots });
};

export const fetchConfig = async (): Promise<CompanyInfo> => {
  const result = await apiRequest('fetchConfig');
  return result.data;
};

export const saveConfig = async (config: CompanyInfo): Promise<void> => {
  await apiRequest('saveConfig', { config });
};

export const bookSlot = async (details: BookingDetails): Promise<boolean> => {
  const result = await apiRequest('bookSlot', { details });
  return result.success;
};
