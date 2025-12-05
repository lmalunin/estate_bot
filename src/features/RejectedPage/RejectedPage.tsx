import { useEffect } from "react";
import { logAction, updateUserState } from "../../utils/api";
import "./RejectedPage.scss";

export function RejectedPage() {
  useEffect(() => {
    const init = async () => {
      await logAction("page_view", "rejected", "Пользователь открыл страницу отклоненной анкеты");
      await updateUserState("rejected");
    };

    init();
  }, []);

  return (
    <div className="rejected-page">
      <div className="icon">❌</div>
      <h1>Анкета отклонена</h1>
      <p>К сожалению, ваша анкета была отклонена.</p>
      <p className="contact">По вопросам обращайтесь в поддержку.</p>
    </div>
  );
}

