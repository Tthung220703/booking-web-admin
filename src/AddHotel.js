import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

function AddHotel() {
  const [hotelName, setHotelName] = useState('');
  const [type, setType] = useState('hotel');
  const [mainImage, setMainImage] = useState('');
  const [subImages, setSubImages] = useState(['']);
  const [pricePerNight, setPricePerNight] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [amenities, setAmenities] = useState([]);
  const [rooms, setRooms] = useState([{ roomType: '', price: '', available: '' }]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user); // Nếu có user thì isLoggedIn = true
    });
    return () => unsubscribe();
  }, []);

  const handleAddHotel = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;

    if (!hotelName || !address || !city || !description || !mainImage) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'hotels'), {
        hotelName,
        type,
        mainImage,
        subImages: subImages.filter((img) => img.trim()),
        pricePerNight: Number(pricePerNight),
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
        userId,
        createdAt: new Date().toISOString(),
      });
      alert('Khách sạn/homestay đã được thêm!');
      resetForm();
    } catch (error) {
      console.error('Lỗi khi thêm khách sạn/homestay:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHotelName('');
    setType('hotel');
    setMainImage('');
    setSubImages(['']);
    setPricePerNight('');
    setAddress('');
    setCity('');
    setDescription('');
    setRating(0);
    setAmenities([]);
    setRooms([{ roomType: '', price: '', available: '' }]);
  };

  const addSubImage = () => {
    setSubImages([...subImages, '']);
  };

  const removeSubImage = (index) => {
    const updatedImages = subImages.filter((_, i) => i !== index);
    setSubImages(updatedImages);
  };

  const updateSubImage = (index, value) => {
    const updatedImages = [...subImages];
    updatedImages[index] = value;
    setSubImages(updatedImages);
  };

  const addRoom = () => {
    setRooms([...rooms, { roomType: '', price: '', available: '' }]);
  };

  const updateRoom = (index, field, value) => {
    const updatedRooms = [...rooms];
    updatedRooms[index][field] = value;
    setRooms(updatedRooms);
  };

  const removeRoom = (index) => {
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setRooms(updatedRooms);
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>Thêm Khách Sạn/Homestay</h2>
        <p style={styles.warning}>
          Bạn cần phải <a href="/login" style={styles.link}>đăng nhập</a> để thêm khách sạn hoặc homestay.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Thêm Khách Sạn/Homestay</h2>
      <form onSubmit={handleAddHotel} style={styles.form}>
        <label style={styles.label}>Tên khách sạn/homestay</label>
        <input
          type="text"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          style={styles.input}
          required
        />
        <label style={styles.label}>Loại hình</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={styles.input}
          required
        >
          <option value="hotel">Khách sạn</option>
          <option value="homestay">Homestay</option>
        </select>
        <label style={styles.label}>URL ảnh chính</label>
        <input
          type="url"
          value={mainImage}
          onChange={(e) => setMainImage(e.target.value)}
          style={styles.input}
          required
        />
        <label style={styles.label}>Ảnh phụ</label>
        {subImages.map((image, index) => (
          <div key={index} style={styles.imageRow}>
            <input
              type="url"
              value={image}
              onChange={(e) => updateSubImage(index, e.target.value)}
              style={styles.input}
              placeholder={`Ảnh phụ ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeSubImage(index)}
              style={styles.deleteButton}
            >
              Xoá
            </button>
          </div>
        ))}
        <button type="button" onClick={addSubImage} style={styles.addButton}>
          Thêm ảnh phụ
        </button>
        <label style={styles.label}>Địa chỉ</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={styles.input}
          required
        />
        <label style={styles.label}>Thành phố</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={styles.input}
          required
        />
        <label style={styles.label}>Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
          required
        />
        <label style={styles.label}>Xếp hạng</label>
        <input
          type="number"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          style={styles.input}
          min="0"
          max="5"
          step="0.1"
          required
        />
        <label style={styles.label}>Tiện ích</label>
        <textarea
          value={amenities.join(', ')}
          onChange={(e) => setAmenities(e.target.value.split(',').map((a) => a.trim()))}
          style={styles.textarea}
        />
        <h3>Phòng</h3>
        {rooms.map((room, index) => (
          <div key={index} style={styles.roomRow}>
            <input
              type="text"
              value={room.roomType}
              onChange={(e) => updateRoom(index, 'roomType', e.target.value)}
              style={styles.input}
              placeholder="Loại phòng"
              required
            />
            <input
              type="number"
              value={room.price}
              onChange={(e) => updateRoom(index, 'price', e.target.value)}
              style={styles.input}
              placeholder="Giá"
              required
            />
            <input
              type="number"
              value={room.available}
              onChange={(e) => updateRoom(index, 'available', e.target.value)}
              style={styles.input}
              placeholder="Số lượng"
              required
            />
            <button
              type="button"
              onClick={() => removeRoom(index)}
              style={styles.deleteButton}
            >
              Xoá
            </button>
          </div>
        ))}
        <button type="button" onClick={addRoom} style={styles.addButton}>
          Thêm phòng mới
        </button>
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? 'Đang thêm...' : 'Thêm khách sạn/homestay'}
        </button>
      </form>
    </div>
  );
}

// const styles = {
//   container: {
//     maxWidth: '600px',
//     margin: '0 auto',
//     padding: '20px',
//     fontFamily: 'Arial, sans-serif',
//   },
//   heading: {
//     textAlign: 'center',
//     marginBottom: '20px',
//   },
//   warning: {
//     textAlign: 'center',
//     color: '#e74c3c',
//     fontSize: '18px',
//   },
//   link: {
//     color: '#3498db',
//     textDecoration: 'underline',
//   },
//   form: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '15px',
//   },
//   label: {
//     fontWeight: 'bold',
//   },
//   input: {
//     padding: '10px',
//     borderRadius: '5px',
//     border: '1px solid #ddd',
//   },
//   textarea: {
//     padding: '10px',
//     borderRadius: '5px',
//     border: '1px solid #ddd',
//     minHeight: '80px',
//   },
//   imageRow: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//   },
//   roomRow: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//   },
//   deleteButton: {
//     backgroundColor: '#e74c3c',
//     color: '#fff',
//     border: 'none',
//     padding: '5px 10px',
//     cursor: 'pointer',
//     borderRadius: '5px',
//   },
//   addButton: {
//     backgroundColor: '#3498db',
//     color: '#fff',
//     border: 'none',
//     padding: '10px',
//     cursor: 'pointer',
//     borderRadius: '5px',
//   },
//   submitButton: {
//     backgroundColor: '#2ecc71',
//     color: '#fff',
//     border: 'none',
//     padding: '15px',
//     cursor: 'pointer',
//     borderRadius: '5px',
//   },
// };
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '1.8rem', // Kích thước chữ lớn hơn
  },
  warning: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: '1rem',
  },
  link: {
    color: '#3498db',
    textDecoration: 'underline',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '1rem',
  },
  textarea: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    minHeight: '80px',
    fontSize: '1rem',
  },
  imageRow: {
    display: 'flex',
    flexDirection: 'column', // Chuyển thành cột trên màn hình nhỏ
    gap: '10px',
  },
  roomRow: {
    display: 'flex',
    flexDirection: 'column', // Chuyển thành cột trên màn hình nhỏ
    gap: '10px',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    padding: '5px 10px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '0.9rem',
  },
  addButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '1rem',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    padding: '15px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '1rem',
  },
  // Media query cho màn hình nhỏ hơn
  '@media (max-width: 768px)': {
    container: {
      maxWidth: '90%', // Giảm kích thước tối đa
      padding: '10px',
    },
    heading: {
      fontSize: '1.5rem', // Giảm kích thước chữ
    },
    input: {
      fontSize: '0.9rem',
    },
    textarea: {
      fontSize: '0.9rem',
    },
    deleteButton: {
      fontSize: '0.8rem',
    },
    addButton: {
      fontSize: '0.9rem',
    },
    submitButton: {
      fontSize: '0.9rem',
    },
    imageRow: {
      flexDirection: 'column', // Chuyển thành cột
    },
    roomRow: {
      flexDirection: 'column', // Chuyển thành cột
    },
  },
};

export default AddHotel;
