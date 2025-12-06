import { useEffect, useState, useRef } from "react";
import {
  confirmContract,
  getApiUrl,
  getChatId,
  getUser,
  logAction,
  updateUserState,
} from "../../utils/api";
import "./ContractPage.scss";

export function ContractPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const init = async () => {
      await logAction(
        "page_view",
        "contract",
        "Пользователь открыл страницу договора"
      );
      await updateUserState("contract");

      const user = await getUser();
      if (user?.contract_confirmed) {
        setConfirmed(true);
      }
    };

    init();
  }, []);

  // 🔑 Загружаем PDF через fetch + Blob (без query-параметров!)
  useEffect(() => {
    const loadPDF = async () => {
      const chatId = getChatId();
      if (!chatId) {
        setError("Chat ID не найден");
        setPdfLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiUrl()}/api/contract/pdf`, {
          method: "GET",
          headers: {
            "X-Chat-ID": chatId.toString(),
            "Content-Type": "application/pdf",
          },
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const blob = await response.blob();
        if (blob.type !== "application/pdf") {
          throw new Error("Ответ не является PDF");
        }

        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        logAction("button_click", "contract", "Договор загружен как Blob");
      } catch (err) {
        console.error("Ошибка загрузки PDF:", err);
        setError("Не удалось загрузить договор. Попробуйте позже.");
      } finally {
        setPdfLoading(false);
      }
    };

    loadPDF();

    // Cleanup: revokes URL
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [getApiUrl]);

  const handleDownload = async () => {
    const chatId = getChatId();
    if (!chatId) return;

    try {
      // Используем fetch для получения PDF с правильными заголовками
      const response = await fetch(`${getApiUrl()}/api/contract/pdf`, {
        method: "GET",
        headers: {
          "X-Chat-ID": chatId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      // Получаем blob и создаем URL для скачивания
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Создаем ссылку для скачивания
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract_${chatId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Очищаем
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      logAction("button_click", "contract", "Скачан договор");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError("Ошибка при скачивании договора");
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    await logAction("button_click", "contract", 'Нажата кнопка "Одобряю"');

    const success = await confirmContract();
    if (success) {
      setConfirmed(true);
      await logAction("button_click", "contract", "Договор подтвержден");
    } else {
      setError("Ошибка при подтверждении договора");
      setLoading(false);
    }
  };

  return (
    <div className="contract-page">
      <h1>Договор</h1>

      <div className="download-section">
        <button
          className="download-button"
          onClick={handleDownload}
          disabled={!pdfBlobUrl}
        >
          📥 Скачать договор
        </button>
      </div>

      {pdfLoading ? (
        <div className="pdf-placeholder">Загрузка договора...</div>
      ) : error ? (
        <div className="pdf-error">{error}</div>
      ) : pdfBlobUrl ? (
        <div className="pdf-viewer">
          <iframe
            ref={iframeRef}
            src={pdfBlobUrl}
            title="Contract PDF"
            width="100%"
            height="600px"
            style={{ border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </div>
      ) : null}

      {confirmed ? (
        <div className="confirmed-section">
          <div className="checkmark">✅</div>
          <p className="confirmed-text">Договор подтвержден</p>
          <p className="waiting-text">
            Ожидайте звонка от владельца жилого помещения.
          </p>
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
