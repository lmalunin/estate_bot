import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUser,
  logAction,
  updateUserState,
  type UserData,
} from "../../utils/api";
import "./Home.scss";
import type { DebugProps } from "../../types";

export function Home({ messageApiUrl, setDebugLogs }: DebugProps) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Стабилизируем addDebugLog (добавьте это перед useMemo для clientConfig)
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message); // Для fallback в обычном браузере
  }, []); // Нет deps, так как timestamp динамичный, но setDebugLogs стабилен

  useEffect(() => {
    const urlLog = `Home 🔗 messageApiUrl: ${messageApiUrl}`;
    setDebugLogs((prev) => [...prev, urlLog]);
  }, [messageApiUrl, setDebugLogs]);

  useEffect(() => {
    const init = async () => {
      // Логируем открытие страницы
      await logAction(
        "page_view",
        "home",
        "Пользователь открыл страницу приветствия"
      );

      // Получаем данные пользователя из БД
      const user = await getUser(messageApiUrl);

      addDebugLog(`🔍 Home - user: "${user}"`);

      if (user) {
        setUserData(user);

        // Если state пустой или "home", обновляем его
        if (!user.state || user.state === "" || user.state === "home") {
          await updateUserState("home");
        }
      }

      setLoading(false);
    };

    init();
  }, [navigate]);

  // Используем данные из БД, если они есть, иначе fallback на Telegram WebApp
  const telegramApp = (window as any).Telegram?.WebApp;
  const telegramUser = telegramApp?.initDataUnsafe?.user;

  const username =
    userData?.telegram_username ||
    (telegramUser?.username ? `@${telegramUser.username}` : "") ||
    "не указан";

  const phone = userData?.phone || telegramUser?.phone_number || "не указан";

  if (loading) {
    return (
      <div className="home-page">
        <p>Загрузка...</p>
      </div>
    );
  }

  // Форматируем username - если начинается с @, оставляем как есть, иначе добавляем
  const displayUsername =
    username && username !== "не указан"
      ? username.startsWith("@")
        ? username
        : `@${username}`
      : "не указан";

  return (
    <div className="home-page">
      <h1>Добро пожаловать!</h1>
      <div className="user-info">
        <p>
          <strong>Ваш логин в Telegram:</strong> {displayUsername}
        </p>
        <p>
          <strong>Ваш телефон:</strong> {phone}
        </p>
      </div>
      <p className="description">
        Для продолжения необходимо заполнить анкету. Нажмите кнопку ниже, чтобы
        начать.
      </p>
      <button
        className="primary-button"
        onClick={async () => {
          await logAction(
            "button_click",
            "home",
            "Нажата кнопка 'Заполнить анкету'"
          );
          await updateUserState("application");
          navigate("/application");
        }}
      >
        Заполнить анкету
      </button>
    </div>
  );
}
