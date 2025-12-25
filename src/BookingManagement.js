import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, getDoc, where } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import './BookingManagement.css'; // Import file CSS mới

// Inline SVG Icons cho giao diện nhất quán và nhẹ
const Icons = {
  Check: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Dollar: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  LogOut: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Print: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  UserX: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
};

const BookingManagement = () => {
    const [orders, setOrders] = useState([]);
    const [hotelNames, setHotelNames] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribeAuth();
    }, []);

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
            // Sắp xếp đơn mới nhất lên đầu
            fetchedOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

    // Hàm xác định class màu sắc cho badge trạng thái
    const getStatusClass = (status) => {
        switch (status) {
            case 'Đang chờ duyệt': return 'pending';
            case 'Đã xác nhận': return 'confirmed';
            case 'Đã thanh toán': return 'paid';
            case 'Đã trả phòng': return 'checked-out';
            case 'Đã hủy': 
            case 'Người dùng không đến': return 'cancelled';
            default: return '';
        }
    };

    const exportInvoice = (order) => {
        const invoiceContent = `
        <html>
            <head>
                <title>Hóa Đơn ${order.id.slice(0, 6)}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                    .header { text-align: center; margin-bottom: 40px; }
                    .header h1 { margin: 0; color: #3b82f6; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .info-item label { font-weight: bold; color: #666; display: block; font-size: 0.9em; }
                    .total { margin-top: 30px; text-align: right; font-size: 1.5em; color: #3b82f6; font-weight: bold; border-top: 2px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="header">
                        <h1>HÓA ĐƠN ĐẶT PHÒNG</h1>
                        <p>Mã đơn: ${order.id}</p>
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><label>Khách sạn:</label> ${hotelNames[order.hotelId] || '...'}</div>
                        <div class="info-item"><label>Khách hàng:</label> ${order.userName}</div>
                        <div class="info-item"><label>SĐT:</label> ${order.phoneNumber}</div>
                        <div class="info-item"><label>Loại phòng:</label> ${order.roomType}</div>
                        <div class="info-item"><label>Số lượng:</label> ${order.roomCount}</div>
                        <div class="info-item"><label>Ngày nhận:</label> ${new Date(order.checkInDate).toLocaleDateString('vi-VN')}</div>
                        <div class="info-item"><label>Ngày trả:</label> ${new Date(order.checkOutDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div class="total">
                        Tổng cộng: ${order.totalPrice.toLocaleString('vi-VN')} VND
                    </div>
                    <p style="text-align: center; margin-top: 50px; color: #888;">Cảm ơn quý khách đã sử dụng dịch vụ!</p>
                </div>
            </body>
        </html>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        printWindow.print();
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnapshot = await getDoc(orderRef);

            if (!orderSnapshot.exists()) return;

            const orderData = orderSnapshot.data();
            const hotelRef = doc(db, 'hotels', orderData.hotelId);
            const hotelSnapshot = await getDoc(hotelRef);

            if (!hotelSnapshot.exists()) return;

            const hotelData = hotelSnapshot.data();

            if (status === 'Đã xác nhận' && orderData.status !== 'Đã xác nhận') {
                const updatedRooms = hotelData.rooms.map((room) =>
                    room.roomType === orderData.roomType
                        ? { ...room, available: room.available - orderData.roomCount }
                        : room
                );
                
                const roomToUpdate = updatedRooms.find(r => r.roomType === orderData.roomType);
                if (roomToUpdate && roomToUpdate.available < 0) {
                    alert('Không đủ phòng trống!');
                    return;
                }
                await updateDoc(hotelRef, { rooms: updatedRooms });
            }

            if (status === 'Người dùng không đến') {
                const updatedRooms = hotelData.rooms.map((room) =>
                    room.roomType === orderData.roomType
                        ? { ...room, available: room.available + orderData.roomCount }
                        : room
                );
                await updateDoc(hotelRef, { rooms: updatedRooms });
            }

            await updateDoc(orderRef, { status });
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Có lỗi xảy ra.');
        }
    };

    const handleCheckOut = async (orderId) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnapshot = await getDoc(orderRef);
            if (!orderSnapshot.exists()) return;

            const orderData = orderSnapshot.data();
            const hotelRef = doc(db, 'hotels', orderData.hotelId);
            const hotelSnapshot = await getDoc(hotelRef);
            if (!hotelSnapshot.exists()) return;

            const hotelData = hotelSnapshot.data();
            const updatedRooms = hotelData.rooms.map((room) =>
                room.roomType === orderData.roomType
                    ? { ...room, available: room.available + orderData.roomCount }
                    : room
            );

            await updateDoc(hotelRef, { rooms: updatedRooms });
            await updateDoc(orderRef, { status: 'Đã trả phòng' });
        } catch (error) {
            console.error('Lỗi trả phòng:', error);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="login-prompt">
                <div className="prompt-card">
                    <h2>🔒 Yêu cầu truy cập</h2>
                    <p>Vui lòng <a href="/login" className="prompt-link">đăng nhập</a> để quản lý đơn đặt phòng.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-container">
            <div className="booking-header">
                <h1>Quản lý Đặt Phòng</h1>
            </div>
            
            <div className="table-card">
                <div className="table-responsive">
                    <table className="booking-table">
                        <thead>
                            <tr>
                                <th>Khách sạn</th>
                                <th>Khách hàng</th>
                                <th>Chi tiết phòng</th>
                                <th>Thời gian</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th style={{textAlign: 'center'}}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{textAlign: 'center', padding: '30px', color: '#888'}}>
                                        Chưa có đơn đặt phòng nào.
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <div style={{fontWeight: 'bold'}}>{hotelNames[order.hotelId] || '...'}</div>
                                    </td>
                                    <td>
                                        <div>{order.userName}</div>
                                        <div style={{fontSize: '0.85em', color: '#666'}}>{order.phoneNumber}</div>
                                    </td>
                                    <td>
                                        <div>{order.roomType}</div>
                                        <div style={{fontSize: '0.85em', color: '#666'}}>x{order.roomCount} phòng</div>
                                    </td>
                                    <td>
                                        <div>Check-in: {new Date(order.checkInDate).toLocaleDateString('vi-VN')}</div>
                                        <div style={{fontSize: '0.85em', color: '#666'}}>Check-out: {new Date(order.checkOutDate).toLocaleDateString('vi-VN')}</div>
                                    </td>
                                    <td style={{fontWeight: 'bold', color: '#3b82f6'}}>
                                        {order.totalPrice.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{justifyContent: 'center'}}>
                                            {order.status === 'Đang chờ duyệt' && (
                                                <>
                                                    <button className="btn-action btn-confirm" onClick={() => updateOrderStatus(order.id, 'Đã xác nhận')} title="Xác nhận">
                                                        <Icons.Check /> <span>Duyệt</span>
                                                    </button>
                                                    <button className="btn-action btn-cancel" onClick={() => updateOrderStatus(order.id, 'Đã hủy')} title="Hủy bỏ">
                                                        <Icons.X /> <span>Hủy</span>
                                                    </button>
                                                </>
                                            )}
                                            
                                            {order.status === 'Đã xác nhận' && (
                                                <>
                                                    <button className="btn-action btn-pay" onClick={() => updateOrderStatus(order.id, 'Đã thanh toán')} title="Đã thanh toán">
                                                        <Icons.Dollar /> <span>Đã TT</span>
                                                    </button>
                                                    <button className="btn-action btn-cancel" onClick={() => updateOrderStatus(order.id, 'Người dùng không đến')} title="Khách không đến">
                                                        <Icons.UserX /> <span>Vắng</span>
                                                    </button>
                                                </>
                                            )}
                                            
                                            {order.status === 'Đã thanh toán' && (
                                                <button className="btn-action btn-checkout" onClick={() => handleCheckOut(order.id)} title="Trả phòng">
                                                    <Icons.LogOut /> <span>Trả phòng</span>
                                                </button>
                                            )}
                                            
                                            <button className="btn-action btn-print" onClick={() => exportInvoice(order)} title="In hóa đơn">
                                                <Icons.Print />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BookingManagement;