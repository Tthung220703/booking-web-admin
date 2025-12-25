import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AddHotel.css';

// SVG Icons cho nhẹ và đẹp
const Icons = {
  Star: ({ filled }) => (
    <svg className={`star-icon ${filled ? 'filled' : ''}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
  Upload: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Save: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
};

function AddHotel() {
  const navigate = useNavigate();
  const [hotelName, setHotelName] = useState('');
  const [type, setType] = useState('hotel');
  const [mainImage, setMainImage] = useState('');
  const [subImages, setSubImages] = useState(['']);
  const [pricePerNight, setPricePerNight] = useState(''); // Giá cơ bản
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [amenities, setAmenities] = useState([]);
  const [rooms, setRooms] = useState([{ roomType: '', price: '', available: '' }]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleAddHotel = async (e) => {
    e.preventDefault();
    if (!hotelName || !address || !city || !description || !mainImage) {
      alert('Vui lòng điền các thông tin bắt buộc!');
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'hotels'), {
        hotelName,
        type,
        mainImage,
        subImages: subImages.filter((img) => img.trim()),
        pricePerNight: Number(pricePerNight), // Lưu giá cơ bản
        address,
        city,
        description,
        rating: Number(rating),
        amenities,
        rooms: rooms.map((room) => ({
          roomType: room.roomType,
          price: Number(room.price),
          available: Number(room.available),
        })),
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
      });
      alert('Thêm thành công!');
      navigate('/'); // Quay về trang chủ hoặc danh sách
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmenitiesChange = (item) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleCustomAmenity = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const val = e.target.value.trim();
      if (!amenities.includes(val)) setAmenities([...amenities, val]);
      e.target.value = '';
    }
  };

  // --- Handlers cho ảnh phụ ---
  const updateSubImage = (index, value) => {
    const updated = [...subImages];
    updated[index] = value;
    setSubImages(updated);
  };
  const addSubImageField = () => setSubImages([...subImages, '']);
  const removeSubImage = (index) => setSubImages(subImages.filter((_, i) => i !== index));

  // --- Handlers cho phòng ---
  const updateRoom = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    setRooms(updated);
  };
  const addRoomField = () => setRooms([...rooms, { roomType: '', price: '', available: '' }]);
  const removeRoom = (index) => setRooms(rooms.filter((_, i) => i !== index));

  if (!isLoggedIn) {
    return (
      <div className="login-prompt">
        <div className="prompt-card">
          <h2>🔒 Yêu cầu đăng nhập</h2>
          <p>Vui lòng <a href="/login" className="link">đăng nhập</a> để thêm khách sạn mới.</p>
        </div>
      </div>
    );
  }

  const commonAmenities = ['Wifi', 'Điều hoà', 'Hồ bơi', 'Bãi đỗ xe', 'Thang máy', 'Gym', 'Nhà hàng', 'Lễ tân 24h'];

  return (
    <div className="add-hotel-container">
      <div className="header-section">
        <h1>Thêm chỗ nghỉ mới</h1>
        <p>Nhập thông tin chi tiết để đăng tải khách sạn hoặc homestay của bạn</p>
      </div>

      <form onSubmit={handleAddHotel} className="add-hotel-form">
        
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="form-card">
          <h3>Thông tin chung</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="label">Tên chỗ nghỉ <span className="required">*</span></label>
              <input 
                className="input-control" 
                value={hotelName} 
                onChange={(e) => setHotelName(e.target.value)} 
                placeholder="VD: Dalat Edensee Lake Resort" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="label">Loại hình</label>
              <select className="input-control" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="hotel">Khách sạn</option>
                <option value="homestay">Homestay</option>
                <option value="resort">Resort</option>
                <option value="villa">Villa</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Giá cơ bản (VND/đêm)</label>
              <input 
                type="number" 
                className="input-control" 
                value={pricePerNight} 
                onChange={(e) => setPricePerNight(e.target.value)} 
                placeholder="VD: 500000" 
              />
            </div>

            <div className="form-group full-width">
                <label className="label">Địa chỉ chi tiết <span className="required">*</span></label>
                <input 
                  className="input-control" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="Số nhà, tên đường" 
                  required
                />
            </div>
            
            <div className="form-group">
                 <label className="label">Thành phố/Tỉnh <span className="required">*</span></label>
                 <input 
                    className="input-control" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    placeholder="VD: Đà Lạt" 
                    required
                 />
            </div>
            
            <div className="form-group full-width">
              <label className="label">Mô tả</label>
              <textarea 
                className="input-control" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Mô tả về không gian, view, tiện ích đặc biệt..."
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: HÌNH ẢNH */}
        <div className="form-card">
          <h3>Hình ảnh</h3>
          
          <div className="form-group">
            <label className="label">Ảnh đại diện (URL) <span className="required">*</span></label>
            <div className="image-preview-box">
              {mainImage ? <img src={mainImage} alt="Main preview" /> : <span className="placeholder-text">Chưa có ảnh</span>}
              <div className="url-input-overlay">
                <input 
                  type="url" 
                  className="input-control" 
                  placeholder="Dán link ảnh vào đây..." 
                  value={mainImage}
                  onChange={(e) => setMainImage(e.target.value)}
                  style={{border: 'none', background: 'transparent', padding: 0}}
                  required
                />
              </div>
            </div>
          </div>

          <label className="label" style={{marginTop: '20px'}}>Ảnh phụ</label>
          <div className="sub-images-grid">
            {subImages.map((img, idx) => (
              <div key={idx} className="sub-image-item">
                 {img ? <img src={img} alt="Sub" /> : <div style={{width:'100%', height:'100%', background: '#eee'}} />}
                 <button type="button" className="btn-remove-img" onClick={() => removeSubImage(idx)}>✕</button>
                 <input 
                    type="url"
                    className="input-control"
                    style={{position:'absolute', bottom:0, left:0, fontSize:'12px', padding:'4px', borderRadius: '0 0 8px 8px'}}
                    placeholder="URL ảnh..."
                    value={img}
                    onChange={(e) => updateSubImage(idx, e.target.value)}
                 />
              </div>
            ))}
            <button type="button" className="btn-add-img" onClick={addSubImageField}>
               <Icons.Upload />
               <span style={{fontSize: '0.8rem', marginTop: '4px'}}>Thêm ảnh</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: TIỆN ÍCH & ĐÁNH GIÁ */}
        <div className="form-card">
          <h3>Tiện ích & Đánh giá</h3>
          
          <div className="form-group">
            <label className="label">Tiện ích có sẵn</label>
            <div className="amenities-list">
              {commonAmenities.map((item) => (
                <label key={item}>
                  <input 
                    type="checkbox" 
                    className="amenity-checkbox"
                    checked={amenities.includes(item)}
                    onChange={() => handleAmenitiesChange(item)}
                  />
                  <span className="amenity-label">{item}</span>
                </label>
              ))}
            </div>
            <input 
                className="input-control" 
                placeholder="Nhập thêm tiện ích khác và nhấn Enter..." 
                onKeyDown={handleCustomAmenity}
                style={{marginTop: '10px'}}
            />
             <div className="amenity-tags-display" style={{marginTop: '10px'}}>
                {amenities.filter(a => !commonAmenities.includes(a)).map((tag, i) => (
                    <span key={i} className="tag">
                        {tag} <span className="tag-remove" onClick={() => handleAmenitiesChange(tag)}>×</span>
                    </span>
                ))}
             </div>
          </div>

          <div className="form-group">
            <label className="label">Hạng sao (Tự đánh giá)</label>
            <div className="rating-wrapper">
               <input 
                 type="number" 
                 className="input-control rating-number" 
                 value={rating} 
                 onChange={(e) => setRating(e.target.value)}
                 min="0" max="5" step="0.5"
               />
               <div className="star-group" onMouseLeave={() => setHoveredStar(0)}>
                 {[1, 2, 3, 4, 5].map(star => (
                   <span 
                    key={star} 
                    onMouseEnter={() => setHoveredStar(star)}
                    onClick={() => setRating(star)}
                   >
                     <Icons.Star filled={star <= (hoveredStar || rating)} />
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: PHÒNG */}
        <div className="form-card">
          <h3>Danh sách phòng</h3>
          {rooms.map((room, index) => (
            <div key={index} className="room-card">
              <div className="room-header">
                <span className="room-title">Phòng #{index + 1}</span>
                {rooms.length > 1 && (
                  <button type="button" className="btn-delete-room" onClick={() => removeRoom(index)}>
                    <div style={{display:'flex', alignItems:'center', gap: '4px'}}>
                        <Icons.Trash /> Xóa
                    </div>
                  </button>
                )}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="label">Tên loại phòng</label>
                  <input 
                    className="input-control" 
                    placeholder="VD: Deluxe Double" 
                    value={room.roomType}
                    onChange={(e) => updateRoom(index, 'roomType', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Giá (VND)</label>
                  <input 
                    type="number" 
                    className="input-control" 
                    value={room.price}
                    onChange={(e) => updateRoom(index, 'price', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Số lượng trống</label>
                  <input 
                    type="number" 
                    className="input-control" 
                    value={room.available}
                    onChange={(e) => updateRoom(index, 'available', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn-add-room" onClick={addRoomField}>+ Thêm loại phòng khác</button>
        </div>

        {/* ACTIONS */}
        <div className="action-bar">
          <button type="button" className="btn btn-cancel" onClick={() => navigate(-1)}>Hủy bỏ</button>
          <button type="submit" className="btn btn-submit" disabled={loading}>
            {loading ? 'Đang lưu...' : <><Icons.Save /> Lưu thông tin</>}
          </button>
        </div>

      </form>
    </div>
  );
}

export default AddHotel;