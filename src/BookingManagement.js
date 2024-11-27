import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, getDoc, where } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

const BookingManagement = () => {
    const [orders, setOrders] = useState([]);
    const [hotelNames, setHotelNames] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Kiểm tra trạng thái đăng nhập
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setIsLoggedIn(!!user);
        });

        return () => unsubscribeAuth();
    }, []);

    // Lấy danh sách đơn đặt phòng
    useEffect(() => {
        if (!isLoggedIn) return;

        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, 'orders'), where('hotelOwnerId', '==', user.uid));
        const unsubscribeOrders = onSnapshot(q, async (snapshot) => {
            const fetchedOrders = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setOrders(fetchedOrders);

            const hotelIds = [...new Set(fetchedOrders.map((order) => order.hotelId))];
            const hotelNameMap = {};

            await Promise.all(
                hotelIds.map(async (hotelId) => {
                    const hotelDoc = await getDoc(doc(db, 'hotels', hotelId));
                    if (hotelDoc.exists()) {
                        hotelNameMap[hotelId] = hotelDoc.data().hotelName;
                    }
                })
            );

            setHotelNames(hotelNameMap);
        });

        return () => unsubscribeOrders();
    }, [isLoggedIn]);

    // Cập nhật trạng thái đơn đặt phòng
    const updateOrderStatus = async (orderId, status) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnapshot = await getDoc(orderRef);

            if (!orderSnapshot.exists()) {
                alert('Không tìm thấy đơn đặt phòng.');
                return;
            }

            const orderData = orderSnapshot.data();
            const hotelRef = doc(db, 'hotels', orderData.hotelId);
            const hotelSnapshot = await getDoc(hotelRef);

            if (!hotelSnapshot.exists()) {
                alert('Không tìm thấy khách sạn.');
                return;
            }

            const hotelData = hotelSnapshot.data();

            // Nếu trạng thái là "Đã xác nhận", giảm số lượng phòng
            if (status === 'Đã xác nhận' && orderData.status !== 'Đã xác nhận') {
                const updatedRooms = hotelData.rooms.map((room) =>
                    room.roomType === orderData.roomType
                        ? { ...room, available: room.available - orderData.roomCount }
                        : room
                );

                const roomToUpdate = updatedRooms.find(
                    (room) => room.roomType === orderData.roomType
                );

                if (roomToUpdate && roomToUpdate.available < 0) {
                    alert('Không đủ phòng trống để xác nhận đơn đặt phòng.');
                    return;
                }

                await updateDoc(hotelRef, { rooms: updatedRooms });
            }

            // Nếu trạng thái là "Người dùng không đến", tăng lại số lượng phòng
            if (status === 'Người dùng không đến') {
                const updatedRooms = hotelData.rooms.map((room) =>
                    room.roomType === orderData.roomType
                        ? { ...room, available: room.available + orderData.roomCount }
                        : room
                );

                await updateDoc(hotelRef, { rooms: updatedRooms });
            }

            // Chỉ cập nhật trạng thái khi cần, không thay đổi số lượng phòng
            await updateDoc(orderRef, { status });
            alert(`Trạng thái đơn đặt phòng đã được cập nhật: ${status}`);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái.');
        }
    };

    // Xử lý trả phòng
    const handleCheckOut = async (orderId) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnapshot = await getDoc(orderRef);

            if (!orderSnapshot.exists()) {
                alert('Không tìm thấy đơn đặt phòng.');
                return;
            }

            const orderData = orderSnapshot.data();

            const hotelRef = doc(db, 'hotels', orderData.hotelId);
            const hotelSnapshot = await getDoc(hotelRef);

            if (!hotelSnapshot.exists()) {
                alert('Không tìm thấy khách sạn.');
                return;
            }

            const hotelData = hotelSnapshot.data();
            const updatedRooms = hotelData.rooms.map((room) =>
                room.roomType === orderData.roomType
                    ? { ...room, available: room.available + orderData.roomCount }
                    : room
            );

            await updateDoc(hotelRef, { rooms: updatedRooms });
            await updateDoc(orderRef, { status: 'Đã trả phòng' });
            alert('Đã trả phòng thành công!');
        } catch (error) {
            console.error('Lỗi khi trả phòng:', error);
            alert('Có lỗi xảy ra khi trả phòng.');
        }
    };

    const styles = {
        container: {
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f5f5f5',
            minHeight: '100vh',
        },
        title: {
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#333',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        tableHead: {
            backgroundColor: '#007BFF',
            color: '#fff',
        },
        tableCell: {
            padding: '10px',
            border: '1px solid #ddd',
            textAlign: 'center',
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
        },
        button: {
            padding: '8px 12px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
        },
        confirmButton: {
            backgroundColor: '#28a745',
            color: '#fff',
        },
        cancelButton: {
            backgroundColor: '#dc3545',
            color: '#fff',
        },
        checkOutButton: {
            backgroundColor: '#007BFF',
            color: '#fff',
        },
        warning: {
            textAlign: 'center',
            color: '#e74c3c',
            fontSize: '18px',
        },
        link: {
            color: '#3498db',
            textDecoration: 'underline',
        },
    };

    if (!isLoggedIn) {
        return (
            <div style={styles.container}>
                <h2 style={styles.title}>Quản lý Đơn Đặt Phòng</h2>
                <p style={styles.warning}>
                    Bạn cần phải <a href="/login" style={styles.link}>đăng nhập</a> để quản lý đơn đặt phòng.
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Quản lý Đơn Đặt Phòng</h1>
            <table style={styles.table}>
                <thead style={styles.tableHead}>
                    <tr>
                        <th style={styles.tableCell}>Khách sạn</th>
                        <th style={styles.tableCell}>Người đặt</th>
                        <th style={styles.tableCell}>Số điện thoại</th>
                        <th style={styles.tableCell}>Loại phòng</th>
                        <th style={styles.tableCell}>Số lượng</th>
                        <th style={styles.tableCell}>Ngày Check-In</th>
                        <th style={styles.tableCell}>Ngày Check-Out</th>
                        <th style={styles.tableCell}>Tổng Giá Tiền</th>
                        <th style={styles.tableCell}>Trạng thái</th>
                        <th style={styles.tableCell}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td style={styles.tableCell}>
                                {hotelNames[order.hotelId] || 'Đang tải...'}
                            </td>
                            <td style={styles.tableCell}>{order.userName}</td>
                            <td style={styles.tableCell}>{order.phoneNumber}</td>
                            <td style={styles.tableCell}>{order.roomType}</td>
                            <td style={styles.tableCell}>{order.roomCount}</td>
                            <td style={styles.tableCell}>
                                {new Date(order.checkInDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={styles.tableCell}>
                                {new Date(order.checkOutDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={styles.tableCell}>
                                {order.totalPrice.toLocaleString('vi-VN')} VND
                            </td>
                            <td style={styles.tableCell}>{order.status}</td>
                            <td style={styles.tableCell}>
                                <div style={styles.buttonContainer}>
                                    {order.status === 'Đang chờ duyệt' && (
                                        <>
                                            <button
                                                style={{ ...styles.button, ...styles.confirmButton }}
                                                onClick={() => updateOrderStatus(order.id, 'Đã xác nhận')}
                                            >
                                                Xác nhận
                                            </button>
                                            <button
                                                style={{ ...styles.button, ...styles.cancelButton }}
                                                onClick={() => updateOrderStatus(order.id, 'Đã hủy')}
                                            >
                                                Hủy
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'Đã xác nhận' && (
                                        <>
                                            <button
                                                style={{ ...styles.button, ...styles.confirmButton }}
                                                onClick={() => updateOrderStatus(order.id, 'Đã thanh toán')}
                                            >
                                                Đã thanh toán
                                            </button>
                                            <button
                                                style={{ ...styles.button, ...styles.cancelButton }}
                                                onClick={() => updateOrderStatus(order.id, 'Người dùng không đến')}
                                            >
                                                Người dùng không đến
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'Đã thanh toán' && (
                                        <button
                                            style={{ ...styles.button, ...styles.checkOutButton }}
                                            onClick={() => handleCheckOut(order.id)}
                                        >
                                            Đã trả phòng
                                        </button>
                                    )}
                                    {order.status === 'Đã trả phòng' && (
                                        <span>Đã trả phòng</span>
                                    )}
                                    {order.status === 'Đã hủy' && (
                                        <span>Đã hủy</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BookingManagement;
