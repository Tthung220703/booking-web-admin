import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Home.css';

// --- ICONS (Giữ nguyên) ---
const Icons = {
  Calendar: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>,
  Money: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Door: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  Plus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  List: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Chat: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  TrendUp: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
};

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

function Home() {
  const [userId, setUserId] = useState(null);
  
  // Dữ liệu thô từ Firebase
  const [allOrders, setAllOrders] = useState([]); 
  
  // Dữ liệu hiển thị
  const [stats, setStats] = useState({ bookings: 0, revenue: 0, availableRooms: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowInventory, setLowInventory] = useState([]);
  
  // Dữ liệu biểu đồ & Bộ lọc
  const [chartData, setChartData] = useState([]);
  const [filterType, setFilterType] = useState('week'); // 'week' | 'month' | 'year'
  
  const [loading, setLoading] = useState(true);

  // 1. Auth Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
        setUserId(u?.uid || null);
        if(!u) setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Lấy dữ liệu Realtime (Chỉ lấy và lưu vào state thô)
  useEffect(() => {
    if (!userId) return;

    // --- ORDERS ---
    const ordersQ = query(collection(db, 'orders'), where('hotelOwnerId', '==', userId));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const validOrders = orders.filter((o) => o.status !== 'Đã hủy'); 
      
      // Tính tổng doanh thu toàn bộ (Lifetime)
      const paidSet = new Set(['Đã thanh toán', 'Đã trả phòng']);
      const totalRev = validOrders
        .filter(o => paidSet.has(o.status))
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

      // Sắp xếp đơn mới nhất
      const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      setAllOrders(validOrders); // Lưu orders hợp lệ để tính biểu đồ sau
      setRecentOrders(sortedOrders.slice(0, 5));
      setStats(prev => ({ ...prev, bookings: validOrders.length, revenue: totalRev }));
    });

    // --- HOTELS ---
    const hotelsQ = query(collection(db, 'hotels'), where('userId', '==', userId));
    const unsubHotels = onSnapshot(hotelsQ, (snap) => {
      const hotels = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      let totalAvail = 0;
      const lowList = [];

      hotels.forEach(h => {
        const rooms = h.rooms || [];
        rooms.forEach(r => {
          const avail = Number(r.available) || 0;
          totalAvail += avail;
          if (avail <= 3) { 
            lowList.push({ 
                hotelName: h.hotelName, 
                roomType: r.roomType, 
                available: avail,
                id: h.id + r.roomType 
            });
          }
        });
      });

      setStats(prev => ({ ...prev, availableRooms: totalAvail }));
      setLowInventory(lowList.sort((a,b) => a.available - b.available).slice(0, 5));
      setLoading(false);
    });

    return () => { unsubOrders(); unsubHotels(); };
  }, [userId]);

  // 3. Xử lý dữ liệu Biểu đồ khi filterType hoặc allOrders thay đổi
  useEffect(() => {
    if (allOrders.length === 0) return;

    const paidSet = new Set(['Đã thanh toán', 'Đã trả phòng']);
    const now = new Date();
    let dataMap = {};
    let keys = [];

    // --- LOGIC GOM NHÓM DỮ LIỆU ---
    if (filterType === 'year') {
      // Logic Năm: 12 tháng của năm hiện tại
      const currentYear = now.getFullYear();
      for (let i = 0; i < 12; i++) {
        keys.push(`Thg ${i + 1}`);
      }
      // Khởi tạo map
      keys.forEach(k => dataMap[k] = 0);

      allOrders.forEach(order => {
        if (paidSet.has(order.status) && order.checkInDate) {
          const d = new Date(order.checkInDate);
          if (d.getFullYear() === currentYear) {
            const key = `Thg ${d.getMonth() + 1}`;
            dataMap[key] += Number(order.totalPrice) || 0;
          }
        }
      });
    } else {
      // Logic Ngày: Tuần (7 ngày) hoặc Tháng (30 ngày)
      const daysToGet = filterType === 'month' ? 30 : 7;
      
      for (let i = daysToGet - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Format YYYY-MM-DD local
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset*60*1000));
        const isoDate = localDate.toISOString().split('T')[0];
        keys.push(isoDate);
        dataMap[isoDate] = 0;
      }

      allOrders.forEach(order => {
        if (paidSet.has(order.status) && order.checkInDate) {
          const dKey = order.checkInDate.split('T')[0];
          if (dataMap[dKey] !== undefined) {
            dataMap[dKey] += Number(order.totalPrice) || 0;
          }
        }
      });
    }

    // Format lại cho Recharts
    const processedData = keys.map(k => {
      // Nếu là ngày YYYY-MM-DD thì format ngắn gọn DD/MM
      let name = k;
      if (k.includes('-')) {
         const [y, m, d] = k.split('-');
         name = `${d}/${m}`;
      }
      return { name: name, revenue: dataMap[k] };
    });

    setChartData(processedData);

  }, [allOrders, filterType]);

  if (loading) return <div className="dashboard-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="home-wrapper">
      <div className="home-container">
        
        {/* HEADER */}
        <div className="dashboard-header">
          <div>
            <h1>Tổng quan</h1>
            <p className="sub-header">Chào mừng trở lại! Hôm nay tình hình kinh doanh thế nào?</p>
          </div>
          <div className="date-badge">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>

        {/* 1. THẺ THỐNG KÊ */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><Icons.Calendar /></div>
            <div className="stat-info">
              <span className="stat-label">Tổng đơn đặt</span>
              <h3 className="stat-value">{stats.bookings}</h3>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green"><Icons.Money /></div>
            <div className="stat-info">
              <span className="stat-label">Doanh thu thực tế</span>
              <h3 className="stat-value">{formatCurrency(stats.revenue)}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange"><Icons.Door /></div>
            <div className="stat-info">
              <span className="stat-label">Phòng trống hiện tại</span>
              <h3 className="stat-value">{stats.availableRooms}</h3>
            </div>
          </div>
        </div>

        {/* 2. BIỂU ĐỒ DOANH THU (ĐÃ NÂNG CẤP) */}
        <div className="section-card chart-section">
          <div className="card-header chart-header-row">
            <div>
              <h4>Biểu đồ doanh thu</h4>
              <div className="trend-badge"><Icons.TrendUp /> Analytics</div>
            </div>
            {/* CÁC NÚT LỌC */}
            <div className="chart-filters">
              <button 
                className={`filter-btn ${filterType === 'week' ? 'active' : ''}`}
                onClick={() => setFilterType('week')}
              >
                7 Ngày
              </button>
              <button 
                className={`filter-btn ${filterType === 'month' ? 'active' : ''}`}
                onClick={() => setFilterType('month')}
              >
                30 Ngày
              </button>
              <button 
                className={`filter-btn ${filterType === 'year' ? 'active' : ''}`}
                onClick={() => setFilterType('year')}
              >
                Năm nay
              </button>
            </div>
          </div>
          
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. KHU VỰC THÔNG TIN (Split View) */}
        <div className="split-grid">
          {/* Cột trái: Đơn hàng gần đây */}
          <div className="section-card">
            <div className="card-header">
              <h4>Đơn đặt gần đây</h4>
              <Link to="/booking-management" className="link-action">Xem tất cả</Link>
            </div>
            <div className="list-wrapper">
              {recentOrders.length === 0 ? (
                <div className="empty-state">Chưa có đơn hàng nào.</div>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="list-item">
                    <div className="avatar-circle">
                      {(order.userName || 'K').charAt(0).toUpperCase()}
                    </div>
                    <div className="item-details">
                      <div className="item-title">{order.userName || 'Khách vãng lai'}</div>
                      <div className="item-sub">
                        {order.roomType} • {new Date(order.checkInDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div className="item-right">
                      <div className="price-text">{Number(order.totalPrice).toLocaleString()}đ</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cột phải: Thao tác nhanh & Cảnh báo */}
          <div className="right-col-stack">
            {/* Quick Actions */}
            <div className="section-card">
              <div className="card-header"><h4>Thao tác nhanh</h4></div>
              <div className="quick-grid">
                <Link to="/add-hotel" className="quick-btn">
                  <div className="q-icon"><Icons.Plus /></div>
                  <span>Thêm KS</span>
                </Link>
                <Link to="/hotel-list" className="quick-btn">
                  <div className="q-icon"><Icons.Door /></div>
                  <span>Phòng</span>
                </Link>
                <Link to="/booking-management" className="quick-btn">
                  <div className="q-icon"><Icons.List /></div>
                  <span>Đơn hàng</span>
                </Link>
                <Link to="/chatbot" className="quick-btn">
                  <div className="q-icon"><Icons.Chat /></div>
                  <span>AI Chat</span>
                </Link>
              </div>
            </div>

            {/* Cảnh báo tồn kho */}
            <div className="section-card">
              <div className="card-header">
                <h4 className="text-danger">Cảnh báo sắp hết phòng</h4>
              </div>
              <div className="inventory-list">
                {lowInventory.length === 0 ? (
                  <div className="empty-state">Tồn kho ổn định.</div>
                ) : (
                  lowInventory.map((item, idx) => (
                    <div key={idx} className="inv-item">
                      <div>
                        <div className="inv-hotel">{item.hotelName}</div>
                        <div className="inv-room">{item.roomType}</div>
                      </div>
                      <div className="inv-badge">Còn {item.available}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;