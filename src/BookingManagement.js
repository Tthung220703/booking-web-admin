import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, getDoc, where } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import './BookingManagement.css';

// --- BỘ ICON SVG ---
const Icons = {
  Check: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Dollar: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  LogOut: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Print: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  UserX: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>,
  Filter: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
};

const BookingManagement = () => {
    const [orders, setOrders] = useState([]);
    const [hotelNames, setHotelNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // --- STATE CHO BỘ LỌC ---
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Đang chờ duyệt', ...
    const [filterHotel, setFilterHotel] = useState('all');   // 'all' hoặc hotelId

    // Kiểm tra đăng nhập
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (!currentUser) setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Lấy dữ liệu Realtime
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'orders'), where('hotelOwnerId', '==', user.uid));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            fetchedOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setOrders(fetchedOrders);

            const hotelIds = [...new Set(fetchedOrders.map(o => o.hotelId))];
            const nameMap = {};
            await Promise.all(hotelIds.map(async (hid) => {
                if(!nameMap[hid]) {
                   const hSnap = await getDoc(doc(db, 'hotels', hid));
                   if (hSnap.exists()) nameMap[hid] = hSnap.data().hotelName;
                }
            }));
            setHotelNames(nameMap);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Update Status
    const updateOrderStatus = async (orderId, newStatus) => {
        if(!window.confirm(`Bạn chắc chắn muốn chuyển trạng thái thành "${newStatus}"?`)) return;

        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) return;
            
            const orderData = orderSnap.data();

            if (newStatus === 'Đã thanh toán' && orderData.status !== 'Đã thanh toán') {
                const hotelRef = doc(db, 'hotels', orderData.hotelId);
                const hotelSnap = await getDoc(hotelRef);
                if (hotelSnap.exists()) {
                    const hotelData = hotelSnap.data();
                    const updatedRooms = hotelData.rooms.map(room => {
                        if (room.roomType === orderData.roomType) {
                            return { ...room, available: room.available - orderData.roomCount };
                        }
                        return room;
                    });
                    
                    const targetRoom = updatedRooms.find(r => r.roomType === orderData.roomType);
                    if (targetRoom && targetRoom.available < 0) {
                        alert('Cảnh báo: Số lượng phòng này hiện không đủ trong hệ thống!');
                    }
                    await updateDoc(hotelRef, { rooms: updatedRooms });
                }
            }
            await updateDoc(orderRef, { status: newStatus });
        } catch (err) {
            console.error(err);
            alert('Lỗi cập nhật: ' + err.message);
        }
    };

    // Check Out
    const handleCheckOut = async (orderId) => {
        if(!window.confirm('Xác nhận khách đã trả phòng? Kho phòng sẽ được cộng lại.')) return;
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) return;
            const orderData = orderSnap.data();

            const hotelRef = doc(db, 'hotels', orderData.hotelId);
            const hotelSnap = await getDoc(hotelRef);
            
            if (hotelSnap.exists()) {
                 const hotelData = hotelSnap.data();
                 const updatedRooms = hotelData.rooms.map(room => 
                    room.roomType === orderData.roomType 
                    ? { ...room, available: room.available + orderData.roomCount } 
                    : room
                 );
                 await updateDoc(hotelRef, { rooms: updatedRooms });
            }
            await updateDoc(orderRef, { status: 'Đã trả phòng' });
        } catch (err) {
            console.error(err);
            alert('Lỗi khi trả phòng: ' + err.message);
        }
    };

    // In hóa đơn
    const exportInvoice = (order) => {
        const content = `
        <html>
            <head>
                <title>INVOICE-${order.id}</title>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .box { max-width: 700px; margin: 0 auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 15px rgba(0,0,0,0.05); }
                    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                    .header h1 { color: #3b82f6; margin: 0; font-size: 24px; }
                    .meta { font-size: 14px; color: #666; text-align: right; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .label { font-weight: bold; color: #555; display: block; font-size: 13px; text-transform: uppercase; margin-bottom: 4px; }
                    .val { font-size: 16px; }
                    .total-box { background: #f8fafc; padding: 20px; text-align: right; border-radius: 8px; margin-top: 20px; }
                    .total-price { font-size: 28px; font-weight: bold; color: #3b82f6; }
                    .footer { text-align: center; margin-top: 40px; font-size: 13px; color: #999; }
                </style>
            </head>
            <body>
                <div class="box">
                    <div class="header">
                        <h1>HÓA ĐƠN ĐẶT PHÒNG</h1>
                        <div class="meta">Mã: #${order.id.slice(-6).toUpperCase()}<br>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div class="info-grid">
                        <div><span class="label">Khách sạn</span><div class="val">${hotelNames[order.hotelId] || 'Hệ thống'}</div></div>
                        <div><span class="label">Khách hàng</span><div class="val">${order.userName}</div></div>
                        <div><span class="label">Số điện thoại</span><div class="val">${order.phoneNumber}</div></div>
                        <div><span class="label">Loại phòng</span><div class="val">${order.roomType} (x${order.roomCount})</div></div>
                        <div><span class="label">Check-in</span><div class="val">${new Date(order.checkInDate).toLocaleDateString('vi-VN')}</div></div>
                        <div><span class="label">Check-out</span><div class="val">${new Date(order.checkOutDate).toLocaleDateString('vi-VN')}</div></div>
                    </div>
                    <div class="total-box">
                        <span class="label">Tổng thanh toán</span>
                        <div class="total-price">${order.totalPrice?.toLocaleString('vi-VN')} VND</div>
                    </div>
                    <div class="footer">Cảm ơn quý khách đã sử dụng dịch vụ!</div>
                </div>
                <script>window.print();</script>
            </body>
        </html>`;
        const win = window.open('', '_blank');
        win.document.write(content);
        win.document.close();
    };

    // --- LOGIC LỌC TỔNG HỢP (DATE + STATUS + HOTEL) ---
    const displayedOrders = orders.filter(o => {
        // 1. Lọc theo Ngày (nếu có chọn)
        let matchDate = true;
        if (filterDate && o.checkInDate) {
            const orderDate = new Date(o.checkInDate);
            const searchDate = new Date(filterDate);
            matchDate = (
                orderDate.getDate() === searchDate.getDate() &&
                orderDate.getMonth() === searchDate.getMonth() &&
                orderDate.getFullYear() === searchDate.getFullYear()
            );
        }

        // 2. Lọc theo Trạng thái
        const matchStatus = filterStatus === 'all' || o.status === filterStatus;

        // 3. Lọc theo Khách sạn
        const matchHotel = filterHotel === 'all' || o.hotelId === filterHotel;

        return matchDate && matchStatus && matchHotel;
    });

    // Reset bộ lọc
    const clearFilters = () => {
        setFilterDate('');
        setFilterStatus('all');
        setFilterHotel('all');
    }

    const getStatusStyle = (s) => {
        switch(s) {
            case 'Đang chờ duyệt': return 'badge-pending';
            case 'Đã xác nhận': return 'badge-confirmed';
            case 'Đã thanh toán': return 'badge-paid';
            case 'Đã trả phòng': return 'badge-out';
            case 'Đã hủy': case 'Người dùng không đến': return 'badge-cancel';
            default: return '';
        }
    }

    if (!user && !loading) return <div className="login-req">Vui lòng <a href="/login">đăng nhập</a> để quản lý.</div>;

    return (
        <div className="manage-page">
            <div className="manage-container">
                {/* --- HEADER & FILTERS --- */}
                <div className="manage-header">
                    <div>
                        <h1>Quản lý Đặt phòng</h1>
                        <p className="subtitle">Theo dõi đơn hàng và trạng thái phòng</p>
                    </div>
                    
                    <div className="filter-group">
                        {/* Lọc Khách Sạn */}
                        <select 
                            className="filter-select" 
                            value={filterHotel} 
                            onChange={(e) => setFilterHotel(e.target.value)}
                        >
                            <option value="all">--- Tất cả Khách sạn ---</option>
                            {Object.entries(hotelNames).map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>

                        {/* Lọc Trạng Thái */}
                        <select 
                            className="filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">--- Tất cả Trạng thái ---</option>
                            <option value="Đang chờ duyệt">Đang chờ duyệt</option>
                            <option value="Đã xác nhận">Đã xác nhận</option>
                            <option value="Đã thanh toán">Đã thanh toán</option>
                            <option value="Đã trả phòng">Đã trả phòng</option>
                            <option value="Đã hủy">Đã hủy</option>
                            <option value="Người dùng không đến">Khách không đến</option>
                        </select>

                        {/* Lọc Ngày */}
                        <input 
                            type="date" 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="date-input"
                        />
                        
                        {/* Nút Xóa Lọc */}
                        {(filterDate || filterStatus !== 'all' || filterHotel !== 'all') && (
                            <button className="btn-clear" onClick={clearFilters}>Xóa lọc</button>
                        )}
                    </div>
                </div>

                {/* --- TABLE CONTENT --- */}
                <div className="table-wrapper table-responsive">
                    {loading ? (
                        <div className="loading-state">Đang tải dữ liệu...</div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Khách hàng</th>
                                    <th>Chi tiết phòng</th>
                                    <th>Thời gian</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th className="text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedOrders.length === 0 ? (
                                    <tr><td colSpan="6" className="empty-row">
                                        Không tìm thấy đơn nào phù hợp với bộ lọc.
                                    </td></tr>
                                ) : displayedOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <div className="fw-bold">{order.userName}</div>
                                            <div className="text-sub">{order.phoneNumber}</div>
                                            <div className="text-hotel">{hotelNames[order.hotelId]}</div>
                                        </td>
                                        <td>
                                            <div className="fw-500">{order.roomType}</div>
                                            <div className="text-sub">SL: {order.roomCount} phòng</div>
                                        </td>
                                        <td>
                                            <div className="date-tag in">{new Date(order.checkInDate).toLocaleDateString('vi-VN')}</div>
                                            <span className="arrow">→</span>
                                            <div className="date-tag out">{new Date(order.checkOutDate).toLocaleDateString('vi-VN')}</div>
                                        </td>
                                        <td>
                                            <div className="price-tag">{order.totalPrice?.toLocaleString('vi-VN')} đ</div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <div className="btn-group">
                                                {order.status === 'Đang chờ duyệt' && (
                                                    <>
                                                        <button className="btn-icon success" title="Duyệt đơn" onClick={() => updateOrderStatus(order.id, 'Đã xác nhận')}><Icons.Check /></button>
                                                        <button className="btn-icon danger" title="Hủy bỏ" onClick={() => updateOrderStatus(order.id, 'Đã hủy')}><Icons.X /></button>
                                                    </>
                                                )}

                                                {order.status === 'Đã xác nhận' && (
                                                    <>
                                                        <button className="btn-pill primary" onClick={() => updateOrderStatus(order.id, 'Đã thanh toán')}><Icons.Dollar /> Thanh toán</button>
                                                        <button className="btn-icon danger" title="Khách không đến" onClick={() => updateOrderStatus(order.id, 'Người dùng không đến')}><Icons.UserX /></button>
                                                    </>
                                                )}

                                                {order.status === 'Đã thanh toán' && (
                                                    <button className="btn-pill dark" onClick={() => handleCheckOut(order.id)}><Icons.LogOut /> Trả phòng</button>
                                                )}

                                                {(order.status === 'Đã thanh toán' || order.status === 'Đã trả phòng') && (
                                                     <button className="btn-icon normal" title="In hóa đơn" onClick={() => exportInvoice(order)}><Icons.Print /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingManagement;