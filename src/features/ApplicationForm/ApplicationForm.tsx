import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { logAction, submitApplication, updateUserState } from "../../utils/api";
import "./ApplicationForm.scss";

interface FormValues {
  passportNumber: string;
  snils: string;
}

export function ApplicationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const telegramApp = (window as any).Telegram?.WebApp;
  const user = telegramApp?.initDataUnsafe?.user;
  const username = user?.username ? `@${user.username}` : "не указан";
  const phone = user?.phone_number || "не указан";
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";

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
      await logAction("page_view", "application", "Пользователь открыл страницу анкеты");
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
      await logAction("button_click", "application", "Анкета успешно отправлена");
      navigate("/waiting");
    } else {
      setError(result.message || "Ошибка при отправке анкеты");
      setLoading(false);
    }
  };

  return (
    <div className="application-form">
      <h1>Заполнение анкеты</h1>

      <div className="readonly-fields">
        <div className="field">
          <label>Ник в Telegram</label>
          <input type="text" value={username} disabled />
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
                message: "Номер паспорта должен содержать только цифры, пробелы и дефисы",
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
                message: "Номер СНИЛС должен содержать только цифры, пробелы и дефисы",
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

