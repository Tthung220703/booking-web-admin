import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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
        alert('Khách sạn đã được xóa');
      } catch (err) {
        console.error('Lỗi khi xóa khách sạn:', err);
        alert('Lỗi khi xóa khách sạn');
      }
    }
  };

  const handleEdit = (hotel) => {
    setEditHotel(hotel);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editHotel) return;

    const hotelRef = doc(db, 'hotels', editHotel.id);
    try {
      await updateDoc(hotelRef, {
        hotelName: editHotel.hotelName,
        pricePerNight: editHotel.pricePerNight,
        address: editHotel.address,
        city: editHotel.city,
        description: editHotel.description,
        mainImage: editHotel.mainImage,
        subImages: editHotel.subImages,
        amenities: editHotel.amenities,
        rooms: editHotel.rooms,
        type: editHotel.type,
      });
      setHotels(hotels.map((hotel) => (hotel.id === editHotel.id ? editHotel : hotel)));
      setEditHotel(null);
      alert('Khách sạn đã được cập nhật');
    } catch (err) {
      console.error('Lỗi khi cập nhật khách sạn:', err);
      alert('Lỗi khi cập nhật khách sạn');
    }
  };

  const addSubImage = () => {
    setEditHotel({
      ...editHotel,
      subImages: [...editHotel.subImages, ''],
    });
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

  if (loading) {
    return <div style={styles.loading}>Đang tải danh sách khách sạn...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Danh sách khách sạn của bạn</h2>
      {editHotel && (
        <div style={styles.editForm}>
          <h3 style={styles.subheading}>Sửa thông tin khách sạn</h3>
          <form onSubmit={handleUpdate}>
            <label style={styles.label}>Tên khách sạn/homestay</label>
            <input
              type="text"
              value={editHotel.hotelName}
              onChange={(e) => setEditHotel({ ...editHotel, hotelName: e.target.value })}
              style={styles.input}
            />

            <label style={styles.label}>Loại</label>
            <select
              value={editHotel.type}
              onChange={(e) => setEditHotel({ ...editHotel, type: e.target.value })}
              style={styles.input}
            >
              <option value="hotel">Khách sạn</option>
              <option value="homestay">Homestay</option>
            </select>

            <label style={styles.label}>Mô tả</label>
            <textarea
              value={editHotel.description}
              onChange={(e) => setEditHotel({ ...editHotel, description: e.target.value })}
              style={styles.textarea}
            />

            <label style={styles.label}>URL ảnh chính</label>
            <input
              type="url"
              value={editHotel.mainImage}
              onChange={(e) => setEditHotel({ ...editHotel, mainImage: e.target.value })}
              style={styles.input}
            />

            <label style={styles.label}>Ảnh phụ</label>
            {editHotel.subImages.map((image, index) => (
              <div key={index} style={styles.imageRow}>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => updateSubImage(index, e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => removeSubImage(index)}
                  style={styles.deleteButton}
                >
                  Xóa
                </button>
              </div>
            ))}
            <button type="button" onClick={addSubImage} style={styles.addButton}>
              Thêm ảnh phụ
            </button>

            <h4 style={styles.roomHeader}>Quản lý phòng</h4>
            {editHotel.rooms.map((room, index) => (
              <div key={index} style={styles.roomRow}>
                <input
                  type="text"
                  placeholder="Loại phòng"
                  value={room.roomType}
                  onChange={(e) => updateRoom(index, 'roomType', e.target.value)}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Giá"
                  value={room.price}
                  onChange={(e) => updateRoom(index, 'price', e.target.value)}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Số lượng"
                  value={room.available}
                  onChange={(e) => updateRoom(index, 'available', e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => removeRoom(index)}
                  style={styles.deleteButton}
                >
                  Xóa phòng
                </button>
              </div>
            ))}
            <button type="button" onClick={addRoom} style={styles.addButton}>
              Thêm phòng mới
            </button>

            <button type="submit" style={styles.submitButton}>
              Cập nhật
            </button>
          </form>
        </div>
      )}
      <ul style={styles.hotelList}>
        {hotels.map((hotel) => (
          <li key={hotel.id} style={styles.hotelItem}>
            <img src={hotel.mainImage} alt={hotel.hotelName} style={styles.hotelImage} />
            <div style={styles.hotelInfo}>
              <h3 style={styles.hotelName}>{hotel.hotelName}</h3>
              <p style={styles.hotelType}>Loại: {hotel.type === 'hotel' ? 'Khách sạn' : 'Homestay'}</p>
              <p style={styles.hotelDescription}>{hotel.description}</p>
            </div>
            <div style={styles.buttonContainer}>
              <button
                onClick={() => handleEdit(hotel)}
                style={styles.button}
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(hotel.id)}
                style={styles.deleteButton}
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// const styles = {
//   container: {
//     maxWidth: '1200px',
//     margin: '0 auto',
//     padding: '20px',
//     fontFamily: 'Arial, sans-serif',
//     backgroundColor: '#f9f9f9',
//     borderRadius: '10px',
//     boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
//   },
//   heading: {
//     fontSize: '32px',
//     textAlign: 'center',
//     color: '#333',
//     marginBottom: '30px',
//     fontWeight: 'bold',
//   },
//   hotelList: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
//     gap: '20px',
//   },
//   hotelItem: {
//     backgroundColor: '#fff',
//     borderRadius: '10px',
//     boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//     overflow: 'hidden',
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   hotelImage: {
//     width: '100%',
//     height: '200px',
//     objectFit: 'cover',
//   },
//   hotelInfo: {
//     padding: '20px',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   hotelName: {
//     fontSize: '22px',
//     fontWeight: 'bold',
//     color: '#222',
//     marginBottom: '5px',
//   },
//   hotelType: {
//     fontSize: '14px',
//     color: '#666',
//     marginBottom: '10px',
//     fontStyle: 'italic',
//   },
//   hotelDescription: {
//     fontSize: '14px',
//     color: '#555',
//     lineHeight: '1.5',
//     marginBottom: '15px',
//   },
//   buttonContainer: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     padding: '20px',
//     borderTop: '1px solid #eee',
//     backgroundColor: '#f9f9f9',
//   },
//   button: {
//     padding: '10px 15px',
//     fontSize: '14px',
//     fontWeight: 'bold',
//     color: '#fff',
//     backgroundColor: '#4CAF50',
//     border: 'none',
//     borderRadius: '5px',
//     cursor: 'pointer',
//     transition: 'background-color 0.3s ease',
//   },
//   deleteButton: {
//     padding: '10px 15px',
//     fontSize: '14px',
//     fontWeight: 'bold',
//     color: '#fff',
//     backgroundColor: '#e74c3c',
//     border: 'none',
//     borderRadius: '5px',
//     cursor: 'pointer',
//     transition: 'background-color 0.3s ease',
//   },
//   editForm: {
//     backgroundColor: '#fff',
//     borderRadius: '10px',
//     padding: '20px',
//     boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
//     marginBottom: '30px',
//   },
//   subheading: {
//     fontSize: '24px',
//     marginBottom: '20px',
//     color: '#333',
//   },
//   formRow: {
//     marginBottom: '20px',
//   },
//   label: {
//     display: 'block',
//     marginBottom: '8px',
//     fontSize: '16px',
//     color: '#555',
//   },
//   input: {
//     width: '100%',
//     padding: '12px',
//     fontSize: '16px',
//     borderRadius: '8px',
//     border: '1px solid #ddd',
//     outline: 'none',
//     transition: 'border-color 0.3s',
//   },
//   textarea: {
//     width: '100%',
//     padding: '12px',
//     fontSize: '16px',
//     borderRadius: '8px',
//     border: '1px solid #ddd',
//     outline: 'none',
//     minHeight: '100px',
//     transition: 'border-color 0.3s',
//   },
//   addButton: {
//     padding: '10px',
//     fontSize: '14px',
//     backgroundColor: '#3498db',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     marginTop: '10px',
//     transition: 'background-color 0.3s',
//   },
//   deleteButtonHover: {
//     backgroundColor: '#c0392b',
//   },
//   roomRow: {
//     display: 'flex',
//     flexDirection: 'row',
//     gap: '10px',
//     marginBottom: '15px',
//   },
//   roomInput: {
//     flex: '1',
//     padding: '10px',
//     borderRadius: '5px',
//     border: '1px solid #ddd',
//   },
//   imageRow: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//     marginBottom: '10px',
//   },
//   loading: {
//     fontSize: '18px',
//     color: '#666',
//     textAlign: 'center',
//     marginTop: '50px',
//   },
//   error: {
//     fontSize: '16px',
//     color: '#e74c3c',
//     textAlign: 'center',
//     marginTop: '50px',
//   },
//   noHotels: {
//     fontSize: '16px',
//     color: '#555',
//     textAlign: 'center',
//     marginTop: '20px',
//   },
//   submitButton: {
//     padding: '12px',
//     fontSize: '16px',
//     fontWeight: 'bold',
//     backgroundColor: '#4CAF50',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     transition: 'background-color 0.3s',
//   },
// };
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '32px',
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
    fontWeight: 'bold',
  },
  hotelList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  hotelItem: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  hotelImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  hotelInfo: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  hotelName: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#222',
    marginBottom: '5px',
  },
  hotelType: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
    fontStyle: 'italic',
  },
  hotelDescription: {
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.5',
    marginBottom: '15px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
  },
  button: {
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  deleteButton: {
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  editForm: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  subheading: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333',
  },
  formRow: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '16px',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
    minHeight: '100px',
    transition: 'border-color 0.3s',
  },
  addButton: {
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s',
  },
  roomRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px',
    marginBottom: '15px',
  },
  imageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  loading: {
    fontSize: '18px',
    color: '#666',
    textAlign: 'center',
    marginTop: '50px',
  },
  error: {
    fontSize: '16px',
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: '50px',
  },
  noHotels: {
    fontSize: '16px',
    color: '#555',
    textAlign: 'center',
    marginTop: '20px',
  },
  submitButton: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  // Media query cho màn hình nhỏ hơn
  '@media (max-width: 768px)': {
    container: {
      padding: '10px',
    },
    heading: {
      fontSize: '24px',
    },
    hotelList: {
      gridTemplateColumns: '1fr', // Chuyển danh sách khách sạn thành 1 cột
    },
    buttonContainer: {
      flexDirection: 'column', // Chuyển các nút thành dạng cột
      gap: '10px',
    },
    button: {
      fontSize: '12px',
      padding: '8px 10px',
    },
    deleteButton: {
      fontSize: '12px',
      padding: '8px 10px',
    },
  },
};


export default HotelList;
