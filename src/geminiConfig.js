// geminiConfig.js
import { GoogleGenAI } from "@google/genai"; 


const API_KEY = 'AIzaSyBEP6nNfWUQ4uhdtGzrL_6ivLc3E2WRt6Q';


if (!API_KEY) {
  console.warn("Chú ý: API key không được tìm thấy. Đặt VITE_GEMINI_API_KEY hoặc GEMINI_API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });


export const sendMessageToGemini = async (message, contextData = {}) => {
  try {
    const isDatabaseQuestion = checkIfDatabaseQuestion(message);

    const systemPrompt = isDatabaseQuestion
      ? `Bạn là một AI assistant chuyên giúp chủ phòng quản lý khách sạn. 
Bạn có thể trả lời các câu hỏi về:
- Thống kê doanh thu và đặt phòng
- Quản lý phòng trống
- Phân tích dữ liệu khách sạn
- Tư vấn chiến lược kinh doanh
- Hỗ trợ quản lý đơn đặt phòng

Dữ liệu hiện tại của khách sạn:
${JSON.stringify(contextData, null, 2)}

Hãy trả lời câu hỏi của người dùng một cách hữu ích và chính xác dựa trên dữ liệu có sẵn.`
      : `Bạn là một AI assistant thân thiện và hữu ích.
Bạn có thể:
- Trò chuyện tự nhiên với người dùng
- Chào hỏi và hỏi thăm
- Trả lời các câu hỏi chung
- Hướng dẫn sử dụng hệ thống quản lý khách sạn

Hãy trả lời thân thiện, tự nhiên và dễ hiểu.`;


    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\nTin nhắn của người dùng: ${message}` },
          ],
        },
      ],
    });
    console.log("Gemini raw result:", result);

    // Parse kết quả an toàn
  if (result?.candidates?.length) {
      const parts = result.candidates[0]?.content?.parts;
      if (parts?.length) {
        const text = parts.map(p => p.text || "").join("\n");
        return text || "(Không có phản hồi)";
      }
    }

    return "(Không có phản hồi)";
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn đến Gemini:", error);
    const msg = error?.message || "";

    if (msg.includes("404") || error?.status === 404) {
      return "Lỗi: Model không tồn tại hoặc API key không hợp lệ. Kiểm tra model name & Google Cloud Console.";
    } else if (msg.includes("403") || error?.status === 403) {
      return "Lỗi: API key không có quyền truy cập.";
    } else if (msg.includes("429") || error?.status === 429) {
      return "Lỗi: Đã vượt quá giới hạn yêu cầu (429). Thử lại sau hoặc giảm tần suất.";
    }
    return "Xin lỗi, đã có lỗi xảy ra khi gọi Gemini.";
  }
};

// Kiểm tra từ khóa liên quan DB
const checkIfDatabaseQuestion = (message) => {
  if (!message) return false;
  const databaseKeywords = [
    "doanh thu","thu nhập","tiền","giá","phòng","khách sạn","homestay",
    "đặt phòng","booking","đơn hàng","thống kê","phân tích","dữ liệu",
    "trống","có sẵn","số lượng","tổng","tính","báo cáo","bảng",
    "khách hàng","người đặt","check-in","check-out","thanh toán",
    "xác nhận","hủy","trả phòng","tình trạng","hiện tại","tháng",
    "tuần","ngày","năm","revenue","booking","room","hotel"
  ];
  const lower = message.toLowerCase();
  return databaseKeywords.some(k => lower.includes(k));
};

