import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.scss";
import App from "./App.tsx";

// 🧪 ЛОКАЛЬНАЯ ЭМУЛЯЦИЯ Telegram WebApp (только в dev, 100% совместимо)
if (import.meta.env.DEV && !(window as any).Telegram?.WebApp) {
  const mockUser = {
    id: 123456789,
    first_name: "Иван",
    last_name: "Петров",
    username: "ivan_p",
    phone_number: "+79991234567",
    language_code: "ru",
  };

  // 💡 base64 от http://localhost:8080/api/message
  const mockStartParam = "aHR0cDovL2xvY2FsaG9zdDo4MDgwL2FwaS9tZXNzYWdl";

  (window as any).Telegram = {
    WebApp: {
      initDataUnsafe: {
        user: mockUser,
        start_param: mockStartParam,
      },
      ready() {
        console.log("[DEV] WebApp.ready()");
      },
      expand() {
        console.log("[DEV] WebApp.expand()");
      },
      close() {
        console.log("[DEV] WebApp.close()");
      },
      sendData(data: string) {
        console.log("[DEV] WebApp.sendData:", data);
        // Отправка напрямую в localhost (для тестов)
        fetch("http://localhost:8080/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
        })
          .then((r) => r.json())
          .then(console.log);
      },
      themeParams: {
        bg_color: "#ffffff",
        text_color: "#000000",
        button_color: "#5984e8",
      },
      colorScheme: "light",
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      version: "7.10",
    },
  };
  console.log("✅ [DEV] Telegram WebApp mocked");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
