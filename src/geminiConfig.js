/**
 * CẤU HÌNH KẾT NỐI PROXY BACKEND
 */
const PROXY_URL = "http://localhost:5001/api/gemini";

/**
 * HÀM CHÍNH GỬI TIN NHẮN
 */
export const sendMessageToGemini = async (message, contextData = {}) => {
  try {
    if (!message || !message.trim()) return "Dạ, Anh/Chị vui lòng nhập nội dung cần hỏi ạ.";

    const isDatabaseQuestion = checkIfDatabaseQuestion(message);

    // THIẾT LẬP PHONG CÁCH "NGƯỜI THẬT"
    const systemInstruction = isDatabaseQuestion
      ? `Bạn là một người quản lý khách sạn chuyên nghiệp và tận tâm.
QUY TẮC TRÒ CHUYỆN:
1. Xưng hô: Tự xưng là "Em" và gọi người dùng là "Anh/Chị".
2. Phong cách: Lịch sự, chân thành, giống như một cộng sự đang báo cáo trực tiếp. 
3. Định dạng: Tuyệt đối KHÔNG dùng các ký tự Markdown như **, ##, ###, hoặc dấu sao ở đầu dòng.
4. Trình bày: Hãy dùng xuống dòng để phân đoạn rõ ràng. Dùng các dấu gạch đầu dòng (-) đơn giản nếu cần liệt kê.
5. Nội dung: Phân tích sâu vào dữ liệu khách sạn được cung cấp bên dưới nhưng giải thích bằng ngôn ngữ đời thường.

DỮ LIỆU KHÁCH SẠN HIỆN TẠI:
${JSON.stringify(contextData, null, 2)}`
      : `Bạn là trợ lý ảo thân thiện của hệ thống quản lý khách sạn. 
Hãy trò chuyện vui vẻ, ngắn gọn bằng tiếng Việt. 
Xưng em, gọi Anh/Chị. KHÔNG dùng ký tự lạ như ** hay ##.`;

    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\nCâu hỏi của Anh/Chị: ${message}` }]
          }
        ],
        generationConfig: {
      temperature: 0.7,      // Độ sáng tạo (0.7 là mức ổn định cho báo cáo)
      maxOutputTokens: 2048, // Tăng lên 2048 hoặc cao hơn để AI viết đủ ý
      topP: 0.95,
      topK: 40
    }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) return "Dạ, hiện tại hệ thống đang hơi quá tải một chút, Anh/Chị đợi em vài giây rồi hỏi lại nhé.";
      throw new Error(data.error || "Lỗi kết nối");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Hậu xử lý: Một lần nữa đảm bảo không còn ký tự lạ lọt lưới
    return text ? text.replace(/[#*]/g, "").trim() : "Dạ, em chưa tìm thấy câu trả lời phù hợp cho ý này ạ.";

  } catch (error) {
    console.error("❌ Lỗi Frontend:", error);
    return "Dạ, kết nối với máy chủ của em đang gặp chút vấn đề, Anh/Chị kiểm tra lại giúp em nhé.";
  }
};

/**
 * BỘ LỌC TỪ KHÓA LIÊN QUAN ĐẾN DỮ LIỆU
 */
const checkIfDatabaseQuestion = (message) => {
  const keywords = [
    "doanh thu", "thu nhập", "tiền", "giá", "phòng", "khách sạn", "homestay",
    "đặt phòng", "booking", "đơn hàng", "thống kê", "phân tích", "dữ liệu",
    "trống", "có sẵn", "báo cáo", "khách hàng", "tháng", "ngày", "năm"
  ];
  const lower = message.toLowerCase();
  return keywords.some(k => lower.includes(k));
};