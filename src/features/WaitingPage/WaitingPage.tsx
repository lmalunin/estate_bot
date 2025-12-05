import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserStatus, logAction, updateUserState } from "../../utils/api";
import "./WaitingPage.scss";

export function WaitingPage() {
  const navigate = useNavigate();
  const [checkStatus, setCheckStatus] = useState<string>("inprogress");

  useEffect(() => {
    const init = async () => {
      await logAction("page_view", "waiting", "Пользователь открыл страницу ожидания");
      await updateUserState("waiting");
    };

    init();
  }, []);

  useEffect(() => {
    // Polling статуса каждые 5 секунд
    const interval = setInterval(async () => {
      const status = await getUserStatus();
      if (status) {
        setCheckStatus(status.checkstatus);

        // Если статус изменился, редиректим на соответствующую страницу
        if (status.checkstatus === "approved") {
          await updateUserState("contract");
          await logAction("page_view", "contract", "Анкета одобрена, переход на страницу договора");
          navigate("/contract");
        } else if (status.checkstatus === "discarded") {
          await updateUserState("rejected");
          await logAction("page_view", "rejected", "Анкета отклонена");
          navigate("/rejected");
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="waiting-page">
      <div className="spinner"></div>
      <h1>Идет проверка анкеты</h1>
      <p>Пожалуйста, подождите. Мы проверяем ваши данные.</p>
      <p className="status">Статус: {checkStatus === "inprogress" ? "В процессе проверки" : checkStatus}</p>
    </div>
  );
}

