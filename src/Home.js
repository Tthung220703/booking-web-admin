import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import './Home.css'; // Import file CSS mới

// Inline Icons SVG
const Icons = {
  Calendar: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Money: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Door: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  Plus: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  List: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Chat: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  ArrowRight: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
};

function Home() {
  const [userId, setUserId] = useState(null);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAvailableRooms, setTotalAvailableRooms] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowInventoryRooms, setLowInventoryRooms] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u?.uid || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Lấy dữ liệu Orders realtime
    const ordersQ = query(
      collection(db, 'orders'),
      where('hotelOwnerId', '==', userId)
    );
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const effectiveOrders = orders.filter((o) => o.status !== 'Đã hủy');
      setTotalBookings(effectiveOrders.length);
      
      const paidStatuses = new Set(['Đã thanh toán', 'Đã trả phòng']);
      const revenue = effectiveOrders
        .filter((o) => paidStatuses.has(o.status))
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
      setTotalRevenue(revenue);

      // Sắp xếp theo ngày check-in mới nhất
      const sorted = [...orders].sort((a, b) => {
        const aTime = a.checkInDate ? new Date(a.checkInDate).getTime() : 0;
        const bTime = b.checkInDate ? new Date(b.checkInDate).getTime() : 0;
        return bTime - aTime;
      });
      setRecentOrders(sorted.slice(0, 5));
    });

    // Lấy dữ liệu Hotels realtime (Tính phòng trống)
    const hotelsQ = query(
      collection(db, 'hotels'),
      where('userId', '==', userId)
    );
    const unsubHotels = onSnapshot(hotelsQ, (snap) => {
      const hotels = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const available = hotels.reduce((sum, h) => {
        const rooms = Array.isArray(h.rooms) ? h.rooms : [];
        return sum + rooms.reduce((rs, r) => rs + (Number(r.available) || 0), 0);
      }, 0);
      setTotalAvailableRooms(available);

      // Tìm phòng sắp hết (<= 2 phòng)
      const lowList = [];
      hotels.forEach((h) => {
        const rooms = Array.isArray(h.rooms) ? h.rooms : [];
        rooms.forEach((r) => {
          const avail = Number(r.available) || 0;
          if (avail <= 2) {
            lowList.push({
              hotelId: h.id,
              hotelName: h.hotelName,
              roomType: r.roomType,
              available: avail,
            });
          }
        });
      });
      lowList.sort((a, b) => a.available - b.available);
      setLowInventoryRooms(lowList.slice(0, 5));
    });

    return () => {
      unsubOrders();
      unsubHotels();
    };
  }, [userId]);

  return (
    <div className="home-container">
      <div className="dashboard-header">
        <h1>Dashboard Tổng quan</h1>
        <p>Chào mừng trở lại! Dưới đây là tình hình kinh doanh của bạn hôm nay.</p>
      </div>

      {/* 1. Thống kê nhanh */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Icons.Calendar /></div>
          <div className="stat-info">
            <h3>Tổng đơn đặt</h3>
            <p className="value">{totalBookings}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green"><Icons.Money /></div>
          <div className="stat-info">
            <h3>Doanh thu</h3>
            <p className="value">{totalRevenue.toLocaleString('vi-VN')}₫</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><Icons.Door /></div>
          <div className="stat-info">
            <h3>Phòng trống</h3>
            <p className="value">{totalAvailableRooms}</p>
          </div>
        </div>
      </section>

      {/* 2. Widgets chính */}
      <section className="dashboard-widgets">
        
        {/* Widget: Đơn gần đây */}
        <div className="widget-card">
          <h4 className="widget-title">Đơn đặt phòng gần đây</h4>
          {recentOrders.length === 0 ? (
            <p className="empty-state">Chưa có đơn đặt phòng nào.</p>
          ) : (
            <ul className="list-group">
              {recentOrders.map((order) => (
                <li key={order.id} className="list-item">
                  <div className="item-main">
                    <span className="item-title">{order.userName || 'Khách vãng lai'}</span>
                    <span className="item-sub">{order.roomType} • {order.roomCount} phòng</span>
                  </div>
                  <div className="item-end">
                    <span className="price-tag">{(Number(order.totalPrice)||0).toLocaleString('vi-VN')}₫</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Widget: Cảnh báo phòng */}
        <div className="widget-card">
          <h4 className="widget-title">Cảnh báo: Sắp hết phòng</h4>
          {lowInventoryRooms.length === 0 ? (
            <p className="empty-state">Tình trạng phòng ổn định.</p>
          ) : (
            <ul className="list-group">
              {lowInventoryRooms.map((room, idx) => (
                <li key={idx} className="list-item">
                  <div className="item-main">
                    <span className="item-title">{room.hotelName}</span>
                    <span className="item-sub">{room.roomType}</span>
                  </div>
                  <span className="warn-badge">Còn {room.available}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Widget: Tác vụ nhanh */}
<div className="widget-card">
          <h4 className="widget-title">Truy cập nhanh</h4>
          <div className="quick-actions-grid">
            
            {/* 1. Thêm khách sạn */}
            <Link to="/add-hotel" className="quick-btn">
              <div className="quick-content">
                <span className="btn-icon" style={{color: '#3b82f6'}}><Icons.Plus /></span>
                <span>Thêm khách sạn mới</span>
              </div>
              <Icons.ArrowRight />
            </Link>

            {/* 2. Danh sách khách sạn (MỚI THÊM) */}
            <Link to="/hotel-list" className="quick-btn">
              <div className="quick-content">
                {/* Dùng màu cam và icon Cửa/Phòng */}
                <span className="btn-icon" style={{color: '#f59e0b'}}><Icons.Door /></span> 
                <span>Danh sách khách sạn</span>
              </div>
              <Icons.ArrowRight />
            </Link>
            
            {/* 3. Quản lý đơn hàng */}
            <Link to="/booking-management" className="quick-btn">
              <div className="quick-content">
                <span className="btn-icon" style={{color: '#10b981'}}><Icons.List /></span>
                <span>Quản lý đơn hàng</span>
              </div>
              <Icons.ArrowRight />
            </Link>
            
            {/* 4. Trợ lý AI */}
            <Link to="/chatbot" className="quick-btn">
              <div className="quick-content">
                <span className="btn-icon" style={{color: '#8b5cf6'}}><Icons.Chat /></span>
                <span>Trợ lý AI</span>
              </div>
              <Icons.ArrowRight />
            </Link>

          </div>
        </div>

      </section>
    </div>
  );
}

export default Home;