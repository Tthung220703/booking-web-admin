import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AddHotel.css';

// --- Icon Components (Giữ nguyên để tối ưu UI) ---
const Icons = {
  Back: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Star: ({ filled }) => (
    <svg className={`star-icon ${filled ? 'filled' : ''}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
  Upload: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Trash: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Save: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
};

function AddHotel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // State quản lý dữ liệu Form
  const [hotelName, setHotelName] = useState('');
  const [type, setType] = useState('hotel');
  const [mainImage, setMainImage] = useState('');
  const [subImages, setSubImages] = useState(['']);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [amenities, setAmenities] = useState([]);
  const [rooms, setRooms] = useState([{ roomType: '', price: '', available: '' }]);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Kiểm tra quyền truy cập (Auth Check)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  /**
   * Xử lý Submit Form:
   * 1. Validate dữ liệu đầu vào.
   * 2. Tính toán giá hiển thị (thấp nhất).
   * 3. Gửi dữ liệu lên Firestore.
   */
  const handleAddHotel = async (e) => {
    e.preventDefault();
    if (!hotelName || !address || !city || !description || !mainImage) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }
    
    setLoading(true);
    try {
      // Tìm giá thấp nhất trong danh sách phòng để hiển thị đại diện
      const prices = rooms.map(r => Number(r.price)).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

      // Chuẩn bị payload gửi lên DB
      const hotelData = {
        hotelName,
        type,
        mainImage,
        subImages: subImages.filter((img) => img.trim() !== ''), // Loại bỏ link rỗng
        pricePerNight: minPrice,
        address,
        city,
        description,
        rating: Number(rating),
        amenities,
        rooms: rooms.map((room) => ({
          roomType: room.roomType,
          price: Number(room.price) || 0,
          available: Number(room.available) || 0,
        })),
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'hotels'), hotelData);
      
      alert('Thêm khách sạn thành công!');
      navigate('/'); 
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Lỗi khi lưu dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle tiện ích: Nếu đã có thì xóa, chưa có thì thêm vào mảng.
   */
  const toggleAmenity = (item) => {
    setAmenities(prev => 
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  /**
   * Xử lý input tiện ích tùy chỉnh khi nhấn Enter.
   */
  const handleCustomAmenity = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const val = e.target.value.trim();
      if (!amenities.includes(val)) setAmenities([...amenities, val]);
      e.target.value = '';
    }
  };

  /**
   * Cập nhật thông tin chi tiết cho từng loại phòng trong mảng rooms.
   */
  const updateRoom = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const updateSubImage = (index, value) => {
    const newImages = [...subImages];
    newImages[index] = value;
    setSubImages(newImages);
  };

  const commonAmenities = ['Wifi', 'Điều hoà', 'Hồ bơi', 'Bãi đỗ xe', 'Thang máy', 'Gym', 'Nhà hàng', 'Lễ tân 24h', 'View biển', 'BBQ'];

  if (!user) return <div className="loading-screen">Đang kiểm tra đăng nhập...</div>;

  return (
    <div className="add-page-wrapper">
      <div className="add-container">
        
        <div className="page-header">
          <h1>Thêm chỗ nghỉ</h1>
        </div>

        <form onSubmit={handleAddHotel} className="main-form">
          
          {/* --- SECTION 1: THÔNG TIN CƠ BẢN --- */}
          <section className="form-section">
            <h3 className="section-title">Thông tin cơ bản</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Tên chỗ nghỉ <span className="req">*</span></label>
                <input 
                  className="input-field" 
                  value={hotelName} onChange={(e) => setHotelName(e.target.value)} 
                  placeholder="Ví dụ: Vinpearl Resort Nha Trang" required 
                />
              </div>

              <div className="form-group">
                <label>Loại hình</label>
                <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="hotel">Khách sạn (Hotel)</option>
                  <option value="homestay">Homestay</option>
                  <option value="resort">Resort</option>
                  <option value="villa">Biệt thự (Villa)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thành phố/Tỉnh <span className="req">*</span></label>
                <input 
                  className="input-field" 
                  value={city} onChange={(e) => setCity(e.target.value)} 
                  placeholder="Ví dụ: Đà Nẵng" required
                />
              </div>
              
              <div className="form-group full">
                <label>Địa chỉ chi tiết <span className="req">*</span></label>
                <input 
                  className="input-field" 
                  value={address} onChange={(e) => setAddress(e.target.value)} 
                  placeholder="Số nhà, tên đường, phường/xã" required
                />
              </div>

              <div className="form-group full">
                <label>Mô tả giới thiệu</label>
                <textarea 
                  className="input-field textarea" 
                  value={description} onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Mô tả những điểm nổi bật của chỗ nghỉ..."
                />
              </div>
            </div>
          </section>

          {/* --- SECTION 2: HÌNH ẢNH --- */}
          <section className="form-section">
            <h3 className="section-title">Hình ảnh</h3>
            
            <div className="form-group">
              <label>Ảnh đại diện (URL) <span className="req">*</span></label>
              <div className="main-image-preview">
                {mainImage ? (
                  <img src={mainImage} alt="Preview" onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=Lỗi+Ảnh'} />
                ) : (
                  <div className="placeholder">Dán link ảnh bên dưới để xem trước</div>
                )}
              </div>
              <input 
                type="url" className="input-field mt-2" 
                placeholder="https://example.com/image.jpg" 
                value={mainImage} onChange={(e) => setMainImage(e.target.value)} required
              />
            </div>

            <div className="form-group">
                <label>Ảnh bộ sưu tập</label>
                <div className="sub-images-list">
                    {subImages.map((img, idx) => (
                        <div key={idx} className="sub-image-row">
                            <input 
                                className="input-field" 
                                placeholder={`URL ảnh phụ ${idx + 1}`}
                                value={img} onChange={(e) => updateSubImage(idx, e.target.value)}
                            />
                            <button type="button" className="btn-icon-del" onClick={() => setSubImages(subImages.filter((_, i) => i !== idx))}>
                                <Icons.Trash />
                            </button>
                        </div>
                    ))}
                    <button type="button" className="btn-dashed" onClick={() => setSubImages([...subImages, ''])}>
                        <Icons.Upload /> Thêm dòng ảnh
                    </button>
                </div>
            </div>
          </section>

          {/* --- SECTION 3: TIỆN ÍCH & ĐÁNH GIÁ --- */}
          <section className="form-section">
            <h3 className="section-title">Tiện ích & Hạng sao</h3>
            
            <div className="form-group">
               <label>Hạng sao tự đánh giá</label>
               <div className="star-rating">
                 {[1, 2, 3, 4, 5].map(star => (
                   <span 
                    key={star} 
                    className="star-wrapper"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                   >
                     <Icons.Star filled={star <= (hoveredStar || rating)} />
                   </span>
                 ))}
                 <span className="rating-text">{rating} Sao</span>
               </div>
            </div>

            <div className="form-group">
              <label>Tiện nghi có sẵn</label>
              <div className="amenities-grid">
                {commonAmenities.map((item) => (
                  <div 
                    key={item} 
                    className={`amenity-chip ${amenities.includes(item) ? 'active' : ''}`}
                    onClick={() => toggleAmenity(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <input 
                className="input-field mt-2" 
                placeholder="Nhập tiện ích khác và ấn Enter..."
                onKeyDown={handleCustomAmenity}
              />
              <div className="custom-tags">
                  {amenities.filter(a => !commonAmenities.includes(a)).map((tag, i) => (
                      <span key={i} className="tag-item">
                          {tag} <span className="tag-close" onClick={() => toggleAmenity(tag)}>×</span>
                      </span>
                  ))}
              </div>
            </div>
          </section>

          {/* --- SECTION 4: DANH SÁCH PHÒNG --- */}
          <section className="form-section">
            <h3 className="section-title">Danh sách loại phòng</h3>
            <div className="room-list">
                {rooms.map((room, index) => (
                    <div key={index} className="room-card-item">
                        <div className="room-header">
                            <h4>Loại phòng {index + 1}</h4>
                            {rooms.length > 1 && (
                                <button type="button" className="btn-text-danger" onClick={() => setRooms(rooms.filter((_, i) => i !== index))}>
                                    Xóa
                                </button>
                            )}
                        </div>
                        <div className="room-inputs">
                            <div className="input-group" style={{flex: 2}}>
                                <label>Tên loại (VD: Deluxe)</label>
                                <input 
                                    className="input-field" value={room.roomType} 
                                    onChange={(e) => updateRoom(index, 'roomType', e.target.value)}
                                />
                            </div>
                            <div className="input-group" style={{flex: 1}}>
                                <label>Giá (VND)</label>
                                <input 
                                    type="number" className="input-field" value={room.price} 
                                    onChange={(e) => updateRoom(index, 'price', e.target.value)}
                                />
                            </div>
                            <div className="input-group" style={{flex: 1}}>
                                <label>SL Trống</label>
                                <input 
                                    type="number" className="input-field" value={room.available} 
                                    onChange={(e) => updateRoom(index, 'available', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button type="button" className="btn-dashed" onClick={() => setRooms([...rooms, { roomType: '', price: '', available: '' }])}>
                    <Icons.Upload /> Thêm loại phòng mới
                </button>
            </div>
          </section>

          <div className="form-actions">
             <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Hủy bỏ</button>
             <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Đang xử lý...' : <><Icons.Save /> Đăng Khách Sạn</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddHotel;