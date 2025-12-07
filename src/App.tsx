import { useEffect, useState, useMemo, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import type { TelegramWindow } from "./types";
import { Home } from "./pages/Home/Home";
import { ApplicationForm } from "./features/ApplicationForm/ApplicationForm";
import { WaitingPage } from "./features/WaitingPage/WaitingPage";
import { ContractPage } from "./features/ContractPage/ContractPage";
import { RejectedPage } from "./features/RejectedPage/RejectedPage";
import { getChatId, getUser } from "./utils/api";
import "./App.scss";
import { DebugPanel } from "./components/DebugPanel";
import { decodeStartParam } from "./utils/startParam";

function App() {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const telegramApp = (window as TelegramWindow).Telegram?.WebApp;
  const isTelegramEnvironment = Boolean(telegramApp);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  // Стабилизируем addDebugLog (добавьте это перед useMemo для clientConfig)
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message); // Для fallback в обычном браузере
  }, []); // Нет deps, так как timestamp динамичный, но setDebugLogs стабилен

  // Теперь чистый useMemo без side-effects
  const clientConfig = useMemo(() => {
    const rawStartParam = telegramApp?.initDataUnsafe?.start_param ?? null;
    const fallbackParam = urlParams.get("tgWebAppStartParam") ?? null;
    const paramToUse = rawStartParam || fallbackParam;
    return decodeStartParam(paramToUse);
  }, [telegramApp, urlParams]); // Добавили urlParams в deps

  // Отдельный useEffect для логов (сработает после рендера, когда telegramApp готов)
  useEffect(() => {
    if (telegramApp) {
      const rawStartParam = telegramApp.initDataUnsafe?.start_param ?? null;
      const fallbackParam = urlParams.get("tgWebAppStartParam") ?? null;
      addDebugLog(`🔍 Raw start_param: "${rawStartParam}" (initDataUnsafe)`);
      addDebugLog(
        `🔍 Fallback tgWebAppStartParam: "${fallbackParam}" (from URL)`
      );
      addDebugLog(`🔧 clientConfig: ${JSON.stringify(clientConfig)}`); // ← Дополнительный лог для проверки возврата
    }
  }, [telegramApp, urlParams, addDebugLog, clientConfig]); // clientConfig в deps, чтобы лог обновлялся при изменении

  const messageApiUrl = clientConfig.backend ?? "";

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

    setInitialized(true);
  }, [navigate, telegramApp]);

  // Проверяем state пользователя при инициализации
  const checkUserState = async () => {
    const user = await getUser(messageApiUrl);

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
  };

  useEffect(() => {
    var chat_id = getChatId();
    addDebugLog(`App 🔍 Raw chat_id: "${chat_id}" (initDataUnsafe)`);

    checkUserState();
  }, [initialized]);

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
        <Route
          path="/"
          element={
            <Home messageApiUrl={messageApiUrl} setDebugLogs={setDebugLogs} />
          }
        />
        <Route
          path="/application"
          element={
            <ApplicationForm
              messageApiUrl={messageApiUrl}
              setDebugLogs={setDebugLogs}
            />
          }
        />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route
          path="/contract"
          element={
            <ContractPage
              messageApiUrl={messageApiUrl}
              setDebugLogs={setDebugLogs}
            />
          }
        />
        <Route path="/rejected" element={<RejectedPage />} />
        {/* Fallback на главную */}
        <Route
          path="*"
          element={
            <Home messageApiUrl={messageApiUrl} setDebugLogs={setDebugLogs} />
          }
        />
      </Routes>

      <div className="debug-panel-container">
        {/* Панель отладки на странице приветствия */}
        {initialized && (
          <DebugPanel
            debugLogs={debugLogs}
            setDebugLogs={setDebugLogs}
            showDebug={showDebug}
            setShowDebug={setShowDebug}
          />
        )}
      </div>
    </div>
  );
}

export default App;
