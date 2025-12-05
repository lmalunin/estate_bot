import { useEffect, useState } from "react";
import { confirmContract, getApiUrl, getChatId, getUser, logAction, updateUserState } from "../../utils/api";
import "./ContractPage.scss";

export function ContractPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await logAction("page_view", "contract", "Пользователь открыл страницу договора");
      await updateUserState("contract");
      
      // Проверяем, подтвержден ли уже договор
      const user = await getUser();
      if (user?.contract_confirmed) {
        setConfirmed(true);
      }
    };

    init();
  }, []);

  const handleDownload = () => {
    const chatId = getChatId();
    if (!chatId) return;
    
    const apiUrl = getApiUrl();
    window.open(`${apiUrl}/api/contract/pdf?chat_id=${chatId}`, "_blank");
    logAction("button_click", "contract", "Скачан договор");
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    await logAction("button_click", "contract", "Нажата кнопка 'Одобряю'");

    const success = await confirmContract();
    if (success) {
      setConfirmed(true);
      await logAction("button_click", "contract", "Договор подтвержден");
    } else {
      setError("Ошибка при подтверждении договора");
      setLoading(false);
    }
  };

  const chatId = getChatId();
  const apiUrl = getApiUrl();
  const pdfUrl = chatId ? `${apiUrl}/api/contract/pdf` : null;

  return (
    <div className="contract-page">
      <h1>Договор</h1>

      <div className="download-section">
        <button className="download-button" onClick={handleDownload}>
          📥 Скачать договор
        </button>
      </div>

      {pdfUrl && (
        <div className="pdf-viewer">
          <iframe
            src={`${pdfUrl}?chat_id=${chatId}`}
            title="Contract PDF"
            width="100%"
            height="600px"
            style={{ border: "none" }}
          />
        </div>
      )}

      {confirmed ? (
        <div className="confirmed-section">
          <div className="checkmark">✅</div>
          <p className="confirmed-text">Договор подтвержден</p>
          <p className="waiting-text">Ожидайте звонка от владельца жилого помещения.</p>
        </div>
      ) : (
        <div className="confirm-section">
          {error && <div className="error-message">{error}</div>}
          <button
            className="primary-button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Подтверждение..." : "Одобряю"}
          </button>
        </div>
      )}
    </div>
  );
}

