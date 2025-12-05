import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logAction, updateUserState } from "../../utils/api";
import "./Home.scss";

export function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      // Логируем открытие страницы
      await logAction("page_view", "home", "Пользователь открыл страницу приветствия");
      
      // Получаем данные пользователя
      const user = await getUser();
      
      if (user && user.state) {
        // Если есть state, редиректим на соответствующую страницу
        if (user.state === "application") {
          navigate("/application");
          return;
        }
        if (user.state === "waiting") {
          navigate("/waiting");
          return;
        }
        if (user.state === "contract") {
          navigate("/contract");
          return;
        }
        if (user.state === "rejected") {
          navigate("/rejected");
          return;
        }
      }
      
      // Если state пустой или "home", обновляем его
      if (!user || !user.state || user.state === "") {
        await updateUserState("home");
      }
    };

    init();
  }, [navigate]);

  // Получаем данные из Telegram для отображения
  const telegramApp = (window as any).Telegram?.WebApp;
  const user = telegramApp?.initDataUnsafe?.user;
  const username = user?.username ? `@${user.username}` : "не указан";
  const phone = user?.phone_number || "не указан";

  return (
    <div className="home-page">
      <h1>Добро пожаловать!</h1>
      <div className="user-info">
        <p>
          <strong>Ваш логин в Telegram:</strong> {username}
        </p>
        <p>
          <strong>Ваш телефон:</strong> {phone}
        </p>
      </div>
      <p className="description">
        Для продолжения необходимо заполнить анкету. Нажмите кнопку ниже, чтобы начать.
      </p>
      <button
        className="primary-button"
        onClick={async () => {
          await logAction("button_click", "home", "Нажата кнопка 'Заполнить анкету'");
          await updateUserState("application");
          navigate("/application");
        }}
      >
        Заполнить анкету
      </button>
    </div>
  );
}

