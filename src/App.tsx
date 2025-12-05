import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import type { TelegramWindow } from "./types";
import { Home } from "./pages/Home/Home";
import { ApplicationForm } from "./features/ApplicationForm/ApplicationForm";
import { WaitingPage } from "./features/WaitingPage/WaitingPage";
import { ContractPage } from "./features/ContractPage/ContractPage";
import { RejectedPage } from "./features/RejectedPage/RejectedPage";
import { getUser } from "./utils/api";
import "./App.scss";

function App() {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const telegramApp = (window as TelegramWindow).Telegram?.WebApp;
  const isTelegramEnvironment = Boolean(telegramApp);

  useEffect(() => {
    if (!telegramApp) {
      // Если не в Telegram, просто показываем приложение
      setInitialized(true);
      return;
    }

    telegramApp.ready();
    telegramApp.expand();

    // Применяем тему Telegram
    const root = document.documentElement;
    const theme = telegramApp.themeParams;
    if (theme?.bg_color) root.style.setProperty("--tg-bg", theme.bg_color);
    if (theme?.text_color)
      root.style.setProperty("--tg-text", theme.text_color);
    if (theme?.hint_color)
      root.style.setProperty("--tg-muted", theme.hint_color);
    if (theme?.button_color)
      root.style.setProperty("--tg-accent", theme.button_color);
    if (theme?.button_text_color)
      root.style.setProperty("--tg-accent-text", theme.button_text_color);

    // Проверяем state пользователя при инициализации
    const checkUserState = async () => {
      const user = await getUser();
      
      if (user && user.state) {
        // Редиректим на соответствующую страницу в зависимости от state
        if (user.state === "application") {
          navigate("/application", { replace: true });
        } else if (user.state === "waiting") {
          navigate("/waiting", { replace: true });
        } else if (user.state === "contract") {
          navigate("/contract", { replace: true });
        } else if (user.state === "rejected") {
          navigate("/rejected", { replace: true });
        } else {
          // state === "home" или пустой - остаемся на главной
          navigate("/", { replace: true });
        }
      } else {
        // Пользователь не найден или state пустой - показываем главную
        navigate("/", { replace: true });
      }
      
      setInitialized(true);
    };

    checkUserState();
  }, [navigate, telegramApp]);

  // Показываем загрузку пока не инициализировались
  if (!initialized && isTelegramEnvironment) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/application" element={<ApplicationForm />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/contract" element={<ContractPage />} />
        <Route path="/rejected" element={<RejectedPage />} />
        {/* Fallback на главную */}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
