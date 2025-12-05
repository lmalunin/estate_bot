// Утилиты для работы с API
import { decodeStartParam } from "./startParam";

export interface UserData {
  chat_id: number;
  telegram_username: string;
  phone: string;
  first_name: string;
  last_name: string;
  passport_number: string;
  snils: string;
  checkstatus: string;
  contract_confirmed: boolean;
  state: string;
}

export interface UserStatus {
  checkstatus: string;
  contract_confirmed: boolean;
}

// Получить chat_id из Telegram
// В Telegram WebApp chat_id = user.id
export function getChatId(): number | null {
  const telegramApp = (window as any).Telegram?.WebApp;
  
  // В Telegram WebApp user.id это и есть chat_id
  if (telegramApp?.initDataUnsafe?.user?.id) {
    return telegramApp.initDataUnsafe.user.id;
  }
  
  return null;
}

// Получить API URL из конфига или переменной окружения
export function getApiUrl(): string {
  const telegramApp = (window as any).Telegram?.WebApp;
  const urlParams = new URLSearchParams(window.location.search);
  
  // Пробуем получить из start_param
  const startParam = urlParams.get("tgWebAppStartParam") || telegramApp?.initDataUnsafe?.start_param;
  
  if (startParam) {
    try {
      // Используем существующую утилиту для декодирования
      const config = decodeStartParam(startParam);
      if (config.backend) {
        return config.backend;
      }
    } catch (e) {
      console.error("Failed to decode start_param:", e);
    }
  }
  
  // Fallback на переменную окружения
  return import.meta.env.VITE_API_URL || "http://localhost:8080";
}

// Создать headers с chat_id
export function createHeaders(): HeadersInit {
  const chatId = getChatId();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (chatId) {
    headers["X-Chat-ID"] = chatId.toString();
  }
  
  return headers;
}

// GET /api/user
export async function getUser(): Promise<UserData | null> {
  const chatId = getChatId();
  if (!chatId) {
    console.error("Chat ID not found");
    return null;
  }
  
  try {
    const response = await fetch(`${getApiUrl()}/api/user`, {
      method: "GET",
      headers: createHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

// POST /api/user/state
export async function updateUserState(state: string): Promise<boolean> {
  const chatId = getChatId();
  if (!chatId) {
    console.error("Chat ID not found");
    return false;
  }
  
  try {
    const response = await fetch(`${getApiUrl()}/api/user/state`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ state }),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Failed to update user state:", error);
    return false;
  }
}

// POST /api/application
export async function submitApplication(
  passportNumber: string,
  snils: string
): Promise<{ success: boolean; message?: string }> {
  const chatId = getChatId();
  if (!chatId) {
    return { success: false, message: "Chat ID not found" };
  }
  
  try {
    const response = await fetch(`${getApiUrl()}/api/application`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({
        passport_number: passportNumber,
        snils: snils,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error || "Failed to submit application" };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to submit application:", error);
    return { success: false, message: "Network error" };
  }
}

// GET /api/user/status
export async function getUserStatus(): Promise<UserStatus | null> {
  const chatId = getChatId();
  if (!chatId) {
    return null;
  }
  
  try {
    const response = await fetch(`${getApiUrl()}/api/user/status`, {
      method: "GET",
      headers: createHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to get user status:", error);
    return null;
  }
}

// POST /api/contract/confirm
export async function confirmContract(): Promise<boolean> {
  const chatId = getChatId();
  if (!chatId) {
    return false;
  }
  
  try {
    const response = await fetch(`${getApiUrl()}/api/contract/confirm`, {
      method: "POST",
      headers: createHeaders(),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Failed to confirm contract:", error);
    return false;
  }
}

// POST /api/log
export async function logAction(
  action: "page_view" | "button_click" | "form_submit",
  page: string,
  message: string
): Promise<void> {
  const chatId = getChatId();
  if (!chatId) {
    return;
  }
  
  try {
    await fetch(`${getApiUrl()}/api/log`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({
        action,
        page,
        message,
      }),
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
}

