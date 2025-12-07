import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  getUser,
  logAction,
  submitApplication,
  updateUserState,
  type UserData,
} from "../../utils/api";
import "./ApplicationForm.scss";
import type { DebugProps } from "../../types";

interface FormValues {
  passportNumber: string;
  snils: string;
}

export function ApplicationForm({ messageApiUrl, setDebugLogs }: DebugProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const urlLog = `ApplicationForm 🔗 messageApiUrl: ${messageApiUrl}`;
    setDebugLogs((prev) => [...prev, urlLog]);
  }, [messageApiUrl, setDebugLogs]);

  // Получаем данные пользователя из БД
  useEffect(() => {
    const loadUser = async () => {
      const user = await getUser(messageApiUrl);

      if (user) {
        setUserData(user);
      }
      setLoadingUser(false);
    };
    loadUser();
  }, []);

  // Fallback на данные из Telegram WebApp, если их нет в БД
  const telegramApp = (window as any).Telegram?.WebApp;
  const telegramUser = telegramApp?.initDataUnsafe?.user;

  const username =
    userData?.telegram_username ||
    (telegramUser?.username ? `@${telegramUser.username}` : "") ||
    "не указан";

  const phone = userData?.phone || telegramUser?.phone_number || "не указан";

  const firstName = userData?.first_name || telegramUser?.first_name || "";

  const lastName = userData?.last_name || telegramUser?.last_name || "";

  // Форматируем username
  const displayUsername =
    username && username !== "не указан"
      ? username.startsWith("@")
        ? username
        : `@${username}`
      : "не указан";

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      passportNumber: "",
      snils: "",
    },
  });

  useEffect(() => {
    const init = async () => {
      await logAction(
        "page_view",
        "application",
        "Пользователь открыл страницу анкеты"
      );
      await updateUserState("application");
    };

    init();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);

    await logAction("form_submit", "application", "Отправка анкеты");

    const result = await submitApplication(data.passportNumber, data.snils);

    if (result.success) {
      await updateUserState("waiting");
      await logAction(
        "button_click",
        "application",
        "Анкета успешно отправлена"
      );
      navigate("/waiting");
    } else {
      setError(result.message || "Ошибка при отправке анкеты");
      setLoading(false);
    }
  };

  return (
    <div className="application-form">
      <h1>Заполнение анкеты</h1>

      {loadingUser ? (
        <p>Загрузка данных...</p>
      ) : (
        <div className="readonly-fields">
          <div className="field">
            <label>Ник в Telegram</label>
            <input type="text" value={displayUsername} disabled />
          </div>
          <div className="field">
            <label>Телефон</label>
            <input type="text" value={phone} disabled />
          </div>
          <div className="field">
            <label>Имя</label>
            <input type="text" value={firstName || "не указано"} disabled />
          </div>
          <div className="field">
            <label>Фамилия</label>
            <input type="text" value={lastName || "не указано"} disabled />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label htmlFor="passportNumber">
            Номер паспорта <span className="required">*</span>
          </label>
          <input
            id="passportNumber"
            type="text"
            {...register("passportNumber", {
              required: "Номер паспорта обязателен",
              pattern: {
                value: /^[\d\s-]+$/,
                message:
                  "Номер паспорта должен содержать только цифры, пробелы и дефисы",
              },
            })}
            placeholder="1234 567890"
          />
          {errors.passportNumber && (
            <span className="error">{errors.passportNumber.message}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="snils">
            Номер СНИЛС <span className="required">*</span>
          </label>
          <input
            id="snils"
            type="text"
            {...register("snils", {
              required: "Номер СНИЛС обязателен",
              pattern: {
                value: /^[\d\s-]+$/,
                message:
                  "Номер СНИЛС должен содержать только цифры, пробелы и дефисы",
              },
            })}
            placeholder="123-456-789 01"
          />
          {errors.snils && (
            <span className="error">{errors.snils.message}</span>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="primary-button"
          disabled={!isValid || loading}
        >
          {loading ? "Отправка..." : "Отправить"}
        </button>
      </form>
    </div>
  );
}
