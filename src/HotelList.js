import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './HotelList.css'; // Đảm bảo import file CSS

function HotelList() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editHotel, setEditHotel] = useState(null); 
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchHotels(currentUser.uid);
      } else {
        setUser(null);
        setError('Bạn cần đăng nhập để xem danh sách khách sạn');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchHotels = async (userId) => {
    const q = query(collection(db, 'hotels'), where('userId', '==', userId));

    try {
      const querySnapshot = await getDocs(q);
      const hotelList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHotels(hotelList);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu');
      console.error('Lỗi khi lấy danh sách khách sạn:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khách sạn này?')) {
      try {
        const hotelRef = doc(db, 'hotels', id);
        await deleteDoc(hotelRef);
        setHotels(hotels.filter((hotel) => hotel.id !== id));
      } catch (err) {
        console.error('Lỗi khi xóa khách sạn:', err);
        alert('Lỗi khi xóa khách sạn');
      }
    }
  };

  const handleEdit = (hotel) => {
    setEditHotel(hotel);
  };

  const closeEdit = () => {
    setEditHotel(null);
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editHotel) return;

    const hotelRef = doc(db, 'hotels', editHotel.id);
    try {
      await updateDoc(hotelRef, {
        hotelName: editHotel.hotelName,
        pricePerNight: editHotel.pricePerNight || '', // Đảm bảo không undefined
        address: editHotel.address || '',
        city: editHotel.city || '',
        description: editHotel.description,
        mainImage: editHotel.mainImage,
        subImages: editHotel.subImages,
        amenities: editHotel.amenities || [],
        rooms: editHotel.rooms,
        type: editHotel.type,
      });
      setHotels(hotels.map((hotel) => (hotel.id === editHotel.id ? editHotel : hotel)));
      setEditHotel(null);
      alert('Cập nhật thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
      alert('Lỗi khi cập nhật khách sạn');
    }
  };

  /* --- Helper Functions for Arrays --- */
  const addSubImage = () => {
    setEditHotel({ ...editHotel, subImages: [...editHotel.subImages, ''] });
  };

  const removeSubImage = (index) => {
    const updatedImages = editHotel.subImages.filter((_, i) => i !== index);
    setEditHotel({ ...editHotel, subImages: updatedImages });
  };

  const updateSubImage = (index, value) => {
    const updatedImages = [...editHotel.subImages];
    updatedImages[index] = value;
    setEditHotel({ ...editHotel, subImages: updatedImages });
  };

  const addRoom = () => {
    setEditHotel({
      ...editHotel,
      rooms: [...editHotel.rooms, { roomType: '', price: '', available: '' }],
    });
  };

  const updateRoom = (index, field, value) => {
    const updatedRooms = [...editHotel.rooms];
    updatedRooms[index][field] = value;
    setEditHotel({ ...editHotel, rooms: updatedRooms });
  };

  const removeRoom = (index) => {
    const updatedRooms = editHotel.rooms.filter((_, i) => i !== index);
    setEditHotel({ ...editHotel, rooms: updatedRooms });
  };

  if (loading) return <div className="loading">Đang tải danh sách...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h2 className="heading">Quản lý Khách sạn</h2>

      {/* --- EDIT MODAL --- */}
      {editHotel && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sửa thông tin: {editHotel.hotelName}</h3>
              <button type="button" className="icon-btn" onClick={closeEdit}>✕</button>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Tên chỗ nghỉ</label>
                <input
                  className="form-input"
                  type="text"
                  value={editHotel.hotelName}
                  onChange={(e) => setEditHotel({ ...editHotel, hotelName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{display: 'flex', gap: '10px'}}>
                <div style={{flex: 1}}>
                    <label className="form-label">Loại hình</label>
                    <select
                    className="form-select"
                    value={editHotel.type}
                    onChange={(e) => setEditHotel({ ...editHotel, type: e.target.value })}
                    >
                    <option value="hotel">Khách sạn</option>
                    <option value="homestay">Homestay</option>
                    <option value="resort">Resort</option>
                    </select>
                </div>
                <div style={{flex: 1}}>
                     <label className="form-label">Thành phố</label>
                     <input
                        className="form-input"
                        type="text"
                        value={editHotel.city || ''}
                        onChange={(e) => setEditHotel({ ...editHotel, city: e.target.value })}
                        placeholder="VD: Đà Lạt"
                     />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={editHotel.description}
                  onChange={(e) => setEditHotel({ ...editHotel, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link Ảnh Chính</label>
                <input
                  className="form-input"
                  type="url"
                  value={editHotel.mainImage}
                  onChange={(e) => setEditHotel({ ...editHotel, mainImage: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ảnh phụ</label>
                {editHotel.subImages.map((image, index) => (
                  <div key={index} className="sub-image-row">
                    <input
                      className="form-input"
                      type="url"
                      placeholder="URL ảnh"
                      value={image}
                      onChange={(e) => updateSubImage(index, e.target.value)}
                    />
                    <button type="button" className="icon-btn" onClick={() => removeSubImage(index)}>🗑️</button>
                  </div>
                ))}
                <button type="button" className="btn btn-add" onClick={addSubImage}>+ Thêm ảnh phụ</button>
              </div>

              <div className="form-group">
                <label className="form-label">Quản lý phòng</label>
                {editHotel.rooms.map((room, index) => (
                  <div key={index} className="room-row">
                    <input
                      className="form-input"
                      placeholder="Loại (VD: Đơn)"
                      value={room.roomType}
                      onChange={(e) => updateRoom(index, 'roomType', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Giá"
                      value={room.price}
                      onChange={(e) => updateRoom(index, 'price', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="SL"
                      style={{width: '60px'}}
                      value={room.available}
                      onChange={(e) => updateRoom(index, 'available', e.target.value)}
                    />
                    <button type="button" className="icon-btn" onClick={() => removeRoom(index)}>🗑️</button>
                  </div>
                ))}
                <button type="button" className="btn btn-add" onClick={addRoom}>+ Thêm phòng</button>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-close" onClick={closeEdit}>Hủy bỏ</button>
                <button type="submit" className="btn btn-edit">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HOTEL LIST --- */}
      {hotels.length === 0 ? (
        <p style={{textAlign: 'center', color: '#666'}}>Chưa có khách sạn nào.</p>
      ) : (
        <ul className="hotel-list">
          {hotels.map((hotel) => (
            <li key={hotel.id} className="hotel-item">
              <img src={hotel.mainImage} alt={hotel.hotelName} className="hotel-image" />
              <div className="hotel-info">
                <div className="hotel-header">
                  <h3 className="hotel-name">{hotel.hotelName}</h3>
                  <span className="hotel-badge">
                    {hotel.type === 'homestay' ? 'Homestay' : 'Hotel'}
                  </span>
                </div>
                
                {hotel.city && (
                    <div className="hotel-location">
                        📍 {hotel.city}
                    </div>
                )}

                <p className="hotel-description">{hotel.description}</p>
              </div>
              
              <div className="button-container">
                <button onClick={() => handleEdit(hotel)} className="btn btn-edit">
                  Sửa
                </button>
                <button onClick={() => handleDelete(hotel.id)} className="btn btn-delete">
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HotelList;