import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './HotelList.css';

// --- 1. SVG ICONS COMPONENTS ---
const Icons = {
  Location: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Home: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Edit: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

// --- 2. HELPER FUNCTIONS (Tách khỏi Component) ---
// Tính tổng số phòng trống
const calculateTotalRooms = (rooms) => {
  if (!rooms || !Array.isArray(rooms)) return 0;
  return rooms.reduce((acc, room) => acc + (parseInt(room.available) || 0), 0);
};

// Tìm giá thấp nhất để hiển thị "Chỉ từ..."
const getLowestPrice = (rooms) => {
  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) return 0;
  const prices = rooms.map(r => parseInt(r.price) || 0).filter(p => p > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

function HotelList() {
  // --- State Management ---
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editHotel, setEditHotel] = useState(null); // Lưu object khách sạn đang chỉnh sửa
  const [user, setUser] = useState(null);

  // --- 3. AUTH & DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchHotels(currentUser.uid);
      } else {
        setUser(null);
        setError('Vui lòng đăng nhập để quản lý danh sách.');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchHotels = async (userId) => {
    try {
      const q = query(collection(db, 'hotels'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const hotelList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHotels(hotelList);
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. CRUD ACTIONS (Delete & Update) ---
  const handleDelete = async (id) => {
    if (window.confirm('Cảnh báo: Bạn có chắc muốn xóa vĩnh viễn khách sạn này?')) {
      try {
        await deleteDoc(doc(db, 'hotels', id));
        setHotels(prev => prev.filter((hotel) => hotel.id !== id));
      } catch (err) {
        alert('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editHotel) return;
    try {
      // Cập nhật lên Firestore
      await updateDoc(doc(db, 'hotels', editHotel.id), {
        ...editHotel,
        pricePerNight: editHotel.pricePerNight || '', // Giữ lại field cũ nếu cần tương thích ngược
      });
      
      // Cập nhật lại UI local ngay lập tức
      setHotels(prev => prev.map((hotel) => (hotel.id === editHotel.id ? editHotel : hotel)));
      setEditHotel(null); // Đóng modal
      alert('Đã cập nhật thông tin thành công!');
    } catch (err) {
      console.error(err);
      alert('Cập nhật thất bại.');
    }
  };

  // --- 5. FORM HANDLERS (Dynamic Inputs) ---
  // Xử lý thay đổi mảng SubImages (Ảnh phụ)
  const updateSubImage = (index, value) => {
    const newImages = [...editHotel.subImages];
    newImages[index] = value;
    setEditHotel({ ...editHotel, subImages: newImages });
  };
  const addSubImage = () => setEditHotel({ ...editHotel, subImages: [...editHotel.subImages, ''] });
  const removeSubImage = (i) => setEditHotel({ ...editHotel, subImages: editHotel.subImages.filter((_, idx) => idx !== i) });
  
  // Xử lý thay đổi mảng Rooms (Phòng)
  const updateRoom = (index, field, value) => {
    const newRooms = [...editHotel.rooms];
    newRooms[index][field] = value;
    setEditHotel({ ...editHotel, rooms: newRooms });
  };
  const addRoom = () => setEditHotel({ ...editHotel, rooms: [...editHotel.rooms, { roomType: '', price: '', available: '' }] });
  const removeRoom = (i) => setEditHotel({ ...editHotel, rooms: editHotel.rooms.filter((_, idx) => idx !== i) });


  // --- 6. RENDER LOGIC ---
  if (loading) return <div className="loading-state"><div className="spinner"></div> Đang tải dữ liệu...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <div className="dashboard-header">
        <h2>Quản Lý Chỗ Nghỉ</h2>
        <p className="subtitle">Bạn đang quản lý {hotels.length} địa điểm</p>
      </div>

      {/* LIST VIEW SECTION */}
      {hotels.length === 0 ? (
        <div className="empty-state">Chưa có khách sạn nào được đăng ký.</div>
      ) : (
        <div className="hotel-grid">
          {hotels.map((hotel) => {
            const totalRooms = calculateTotalRooms(hotel.rooms);
            const startPrice = getLowestPrice(hotel.rooms);

            return (
              <div key={hotel.id} className="hotel-card">
                {/* Image & Badges */}
                <div className="card-image-wrapper">
                  <img 
                    src={hotel.mainImage || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={hotel.hotelName} 
                    className="card-image"
                    onError={(e) => {e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=Error'}} 
                  />
                  <span className={`badge-type ${hotel.type}`}>
                    {hotel.type === 'homestay' ? 'Homestay' : hotel.type === 'resort' ? 'Resort' : 'Hotel'}
                  </span>
                  <div className="price-overlay">
                    <small>Chỉ từ</small>
                    <strong>{startPrice.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>

                {/* Content Info */}
                <div className="card-content">
                  <h3 className="card-title">{hotel.hotelName}</h3>
                  <div className="card-meta">
                    <span className="meta-item location" title={hotel.address}>
                      <Icons.Location /> {hotel.city || 'Chưa cập nhật'}
                    </span>
                  </div>
                  
                  {/* Status Bar: Available Rooms */}
                  <div className="room-status-bar">
                    <div className="status-label">
                      <Icons.Home /> Tình trạng phòng
                    </div>
                    <div className={`status-value ${totalRooms > 0 ? 'available' : 'sold-out'}`}>
                       {totalRooms > 0 ? `${totalRooms} phòng trống` : 'Hết phòng'}
                    </div>
                  </div>

                  <p className="card-desc">{hotel.description}</p>

                  <div className="card-actions">
                    <button onClick={() => setEditHotel(hotel)} className="btn-action edit">
                      <Icons.Edit /> Sửa
                    </button>
                    <button onClick={() => handleDelete(hotel.id)} className="btn-action delete">
                      <Icons.Trash /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL POPUP (Chỉ hiện khi editHotel có dữ liệu) */}
      {editHotel && (
        <div className="modal-backdrop" onClick={() => setEditHotel(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa thông tin</h3>
              <button className="close-btn" onClick={() => setEditHotel(null)}>✕</button>
            </div>
            
            <form onSubmit={handleUpdate} className="modal-body">
              {/* --- Phần 1: Thông tin cơ bản --- */}
              <div className="form-section">
                <h4>Thông tin chung</h4>
                <div className="input-group">
                    <label>Tên chỗ nghỉ</label>
                    <input 
                      type="text" value={editHotel.hotelName} required
                      onChange={(e) => setEditHotel({ ...editHotel, hotelName: e.target.value })}
                    />
                </div>
                <div className="row-2-col">
                    <div className="input-group">
                        <label>Loại hình</label>
                        <select value={editHotel.type} onChange={(e) => setEditHotel({ ...editHotel, type: e.target.value })}>
                            <option value="hotel">Khách sạn</option>
                            <option value="homestay">Homestay</option>
                            <option value="resort">Resort</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Thành phố</label>
                        <input type="text" value={editHotel.city} onChange={(e) => setEditHotel({ ...editHotel, city: e.target.value })} />
                    </div>
                </div>
                <div className="input-group">
                    <label>Mô tả ngắn</label>
                    <textarea rows="3" value={editHotel.description} onChange={(e) => setEditHotel({ ...editHotel, description: e.target.value })}></textarea>
                </div>
                 <div className="input-group">
                    <label>Ảnh đại diện (URL)</label>
                    <input type="url" value={editHotel.mainImage} onChange={(e) => setEditHotel({ ...editHotel, mainImage: e.target.value })} />
                </div>
              </div>

              {/* --- Phần 2: Quản lý Danh sách phòng --- */}
              <div className="form-section">
                <h4>Danh sách phòng & Giá</h4>
                <div className="room-list-editor">
                    {editHotel.rooms.map((room, idx) => (
                        <div key={idx} className="room-editor-item">
                            <input placeholder="Tên loại phòng" value={room.roomType} onChange={(e) => updateRoom(idx, 'roomType', e.target.value)} className="input-room-name"/>
                            <input type="number" placeholder="Giá (VND)" value={room.price} onChange={(e) => updateRoom(idx, 'price', e.target.value)} className="input-room-price"/>
                            <input type="number" placeholder="SL" value={room.available} onChange={(e) => updateRoom(idx, 'available', e.target.value)} className="input-room-qty"/>
                            <button type="button" onClick={() => removeRoom(idx)} className="btn-icon-del">✕</button>
                        </div>
                    ))}
                    <button type="button" className="btn-add-dashed" onClick={addRoom}>+ Thêm loại phòng</button>
                </div>
              </div>

               {/* --- Phần 3: Ảnh bộ sưu tập --- */}
               <div className="form-section">
                <h4>Ảnh bộ sưu tập</h4>
                {editHotel.subImages.map((img, idx) => (
                    <div key={idx} className="sub-img-row">
                        <input type="url" placeholder="URL ảnh phụ" value={img} onChange={(e) => updateSubImage(idx, e.target.value)} />
                        <button type="button" onClick={() => removeSubImage(idx)} className="btn-icon-del">✕</button>
                    </div>
                ))}
                <button type="button" className="btn-text-add" onClick={addSubImage}>+ Thêm link ảnh</button>
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer">
                 <button type="button" className="btn-cancel" onClick={() => setEditHotel(null)}>Hủy</button>
                 <button type="submit" className="btn-save">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotelList;