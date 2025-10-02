import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn('Missing REACT_APP_GEMINI_API_KEY. Set it in .env.local');
}
const genAI = new GoogleGenerativeAI(apiKey || '');

// Khởi tạo model Gemini
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Hàm gửi tin nhắn đến Gemini với context về dữ liệu khách sạn
export const sendMessageToGemini = async (message, contextData = {}) => {
  try {
    // Kiểm tra xem có phải câu hỏi về database không
    const isDatabaseQuestion = checkIfDatabaseQuestion(message);
    
    let systemPrompt;
    
    if (isDatabaseQuestion) {
      // Prompt cho câu hỏi về database
      systemPrompt = `Bạn là một AI assistant chuyên giúp chủ phòng quản lý khách sạn. 
      Bạn có thể trả lời các câu hỏi về:
      - Thống kê doanh thu và đặt phòng
      - Quản lý phòng trống
      - Phân tích dữ liệu khách sạn
      - Tư vấn chiến lược kinh doanh
      - Hỗ trợ quản lý đơn đặt phòng
      
      Dữ liệu hiện tại của khách sạn:
      ${JSON.stringify(contextData, null, 2)}
      
      Hãy trả lời câu hỏi của người dùng một cách hữu ích và chính xác dựa trên dữ liệu có sẵn.`;
    } else {
      // Prompt cho trò chuyện thông thường
      systemPrompt = `Bạn là một AI assistant thân thiện và hữu ích. 
      Bạn có thể:
      - Trò chuyện tự nhiên với người dùng
      - Chào hỏi và hỏi thăm
      - Trả lời các câu hỏi chung
      - Hướng dẫn sử dụng hệ thống quản lý khách sạn
      
      Hãy trả lời một cách thân thiện, tự nhiên và hữu ích. 
      Nếu người dùng hỏi về khách sạn, bạn có thể gợi ý họ hỏi cụ thể hơn về dữ liệu.`;
    }

    const fullMessage = `${systemPrompt}\n\nTin nhắn của người dùng: ${message}`;
    
    const result = await model.generateContent(fullMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn đến Gemini:', error);
    return 'Xin lỗi, tôi không thể xử lý tin nhắn này lúc này. Vui lòng thử lại sau.';
  }
};

// Hàm kiểm tra xem có phải câu hỏi về database không
const checkIfDatabaseQuestion = (message) => {
  const databaseKeywords = [
    'doanh thu', 'thu nhập', 'tiền', 'giá', 'phòng', 'khách sạn', 'homestay',
    'đặt phòng', 'booking', 'đơn hàng', 'thống kê', 'phân tích', 'dữ liệu',
    'trống', 'có sẵn', 'số lượng', 'tổng', 'tính', 'báo cáo', 'bảng',
    'khách hàng', 'người đặt', 'check-in', 'check-out', 'thanh toán',
    'xác nhận', 'hủy', 'trả phòng', 'tình trạng', 'hiện tại', 'tháng',
    'tuần', 'ngày', 'năm', 'revenue', 'booking', 'room', 'hotel'
  ];
  
  const lowerMessage = message.toLowerCase();
  return databaseKeywords.some(keyword => lowerMessage.includes(keyword));
};
