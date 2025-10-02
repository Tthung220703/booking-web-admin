import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

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

    // Orders realtime
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

      // Recent orders (sort by checkInDate desc fallback to createdAt)
      const sorted = [...orders].sort((a, b) => {
        const aTime = a.checkInDate ? new Date(a.checkInDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.checkInDate ? new Date(b.checkInDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime;
      });
      setRecentOrders(sorted.slice(0, 5));
    });

    // Hotels realtime
    const hotelsQ = query(
      collection(db, 'hotels'),
      where('userId', '==', userId)
    );
    const unsubHotels = onSnapshot(hotelsQ, (snap) => {
      const hotels = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const available = hotels.reduce((sum, h) => {
        const rooms = Array.isArray(h.rooms) ? h.rooms : [];
        return (
          sum + rooms.reduce((rs, r) => rs + (Number(r.available) || 0), 0)
        );
      }, 0);
      setTotalAvailableRooms(available);

      // Low inventory list (rooms with available <= 2)
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
      // sort ascending by available
      lowList.sort((a, b) => a.available - b.available);
      setLowInventoryRooms(lowList.slice(0, 6));
    });

    return () => {
      unsubOrders();
      unsubHotels();
    };
  }, [userId]);

  return (
    <div style={styles.page}>
      <div style={styles.noise} />
      <div style={styles.gridOverlay} />

      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>Booking Admin</h1>
          <p style={styles.subtitle}>Quản trị hệ thống đặt phòng – nhanh, mượt, hiện đại</p>

          <div style={styles.ctaRow}>
            <Link to="/hotel-list" style={styles.primaryBtn}>Xem danh sách khách sạn</Link>
            <Link to="/add-hotel" style={styles.secondaryBtn}>Thêm khách sạn</Link>
          </div>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.card}>
            <div style={styles.cardGlow} />
            <h3 style={styles.cardTitle}>Tổng đặt phòng</h3>
            <p style={styles.cardNumber}>{totalBookings.toLocaleString('vi-VN')}</p>
            <span style={styles.cardDeltaNeutral}>Theo thời gian thực</span>
          </div>
          <div style={styles.card}>
            <div style={styles.cardGlow} />
            <h3 style={styles.cardTitle}>Doanh thu</h3>
            <p style={styles.cardNumber}>₫ {totalRevenue.toLocaleString('vi-VN')}</p>
            <span style={styles.cardDeltaNeutral}>Đơn đã thanh toán</span>
          </div>
          <div style={styles.card}>
            <div style={styles.cardGlow} />
            <h3 style={styles.cardTitle}>Phòng trống</h3>
            <p style={styles.cardNumber}>{totalAvailableRooms.toLocaleString('vi-VN')}</p>
            <span style={styles.cardDeltaNeutral}>Cập nhật theo thời gian thực</span>
          </div>
        </div>
      </section>

      <section style={styles.widgets}>
        <div style={styles.widgetCardOuter}>
          <div style={styles.widgetCardInner}>
          <h4 style={styles.widgetTitle}>Đơn gần đây</h4>
          {recentOrders.length === 0 ? (
            <p style={styles.widgetEmpty}>Chưa có đơn nào.</p>
          ) : (
            <ul style={styles.orderList}>
              {recentOrders.map((o) => (
                <li key={o.id} style={styles.orderItem}>
                  <div style={styles.orderHeader}>
                    <div style={styles.orderUser}>{o.userName || 'Khách'}</div>
                    <span style={{
                      ...styles.orderStatus,
                      ...(o.status === 'Đã hủy'
                        ? styles.statusCanceled
                        : o.status === 'Đã thanh toán'
                        ? styles.statusPaid
                        : o.status === 'Đã trả phòng'
                        ? styles.statusCheckedOut
                        : styles.statusPending),
                    }}>{o.status}</span>
                  </div>
                  <div style={styles.orderMeta}>
                    {o.roomType} • {o.roomCount} phòng
                  </div>
                  <div style={styles.orderFooter}>
                    <span style={styles.orderDate}>{new Date(o.checkInDate || o.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span style={styles.orderPrice}>{(Number(o.totalPrice)||0).toLocaleString('vi-VN')}₫</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>

        <div style={styles.widgetCardOuter}>
          <div style={styles.widgetCardInner}>
          <h4 style={styles.widgetTitle}>Phòng sắp hết</h4>
          {lowInventoryRooms.length === 0 ? (
            <p style={styles.widgetEmpty}>Không có phòng nào sắp hết.</p>
          ) : (
            <ul style={styles.lowList}>
              {lowInventoryRooms.map((r, idx) => (
                <li key={idx} style={styles.lowItem}>
                  <div style={styles.lowLeft}>
                    <div style={styles.lowHotel}>{r.hotelName}</div>
                    <div style={styles.lowRoom}>{r.roomType}</div>
                  </div>
                  <div style={styles.lowRight}>
                    <span style={styles.badgeWarn}>{r.available}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>

        <div style={styles.widgetCardOuter}>
          <div style={styles.widgetCardInner}>
          <h4 style={styles.widgetTitle}>Tác vụ nhanh</h4>
            <div style={styles.quickCol}>
              <Link to="/add-hotel" style={styles.quickItem}
                onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(0,0,0,0.35)';}}
                onMouseLeave={(e)=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=styles.quickItem.boxShadow;}}
              >
                <span style={{...styles.quickIcon, background: 'linear-gradient(135deg,#8b5cf6,#22d3ee)'}}>＋</span>
                <span style={styles.quickLabel}>Thêm khách sạn</span>
                <span style={styles.quickChevron}>›</span>
              </Link>
              <Link to="/booking-management" style={styles.quickItem}
                onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(0,0,0,0.35)';}}
                onMouseLeave={(e)=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=styles.quickItem.boxShadow;}}
              >
                <span style={{...styles.quickIcon, background: 'linear-gradient(135deg,#38bdf8,#22c55e)'}}>✓</span>
                <span style={styles.quickLabel}>Quản lý đơn</span>
                <span style={styles.quickChevron}>›</span>
              </Link>
              <Link to="/hotel-list" style={styles.quickItem}
                onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(0,0,0,0.35)';}}
                onMouseLeave={(e)=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=styles.quickItem.boxShadow;}}
              >
                <span style={{...styles.quickIcon, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)'}}>🏨</span>
                <span style={styles.quickLabel}>Danh sách KS</span>
                <span style={styles.quickChevron}>›</span>
              </Link>
              <Link to="/chatbot" style={styles.quickItem}
                onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(0,0,0,0.35)';}}
                onMouseLeave={(e)=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=styles.quickItem.boxShadow;}}
              >
                <span style={{...styles.quickIcon, background: 'linear-gradient(135deg,#f472b6,#60a5fa)'}}>🤖</span>
                <span style={styles.quickLabel}>AI trợ giúp</span>
                <span style={styles.quickChevron}>›</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: 'radial-gradient(1200px 700px at 20% -10%, rgba(88, 28, 135, 0.35), rgba(0,0,0,0)) , radial-gradient(900px 600px at 90% 10%, rgba(14, 165, 233, 0.25), rgba(0,0,0,0)) , #0b0f1a',
    color: '#e5e7eb',
    overflow: 'hidden',
  },
  noise: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type=\'linear\' slope=\'0.025\'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.25\'/%3E%3C/svg%3E")',
    pointerEvents: 'none',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
    backgroundSize: '40px 40px, 40px 40px',
    maskImage: 'radial-gradient(circle at 50% 0%, black 40%, transparent 70%)',
    opacity: 0.4,
    pointerEvents: 'none',
  },
  hero: {
    position: 'relative',
    padding: '80px 24px 40px',
    maxWidth: 1200,
    margin: '0 auto',
    textAlign: 'center',
  },
  heroContent: {
    opacity: 1,
    transform: 'none',
  },
  title: {
    fontSize: '48px',
    lineHeight: 1.1,
    margin: 0,
    background: 'linear-gradient(90deg, #d946ef 0%, #22d3ee 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    marginTop: 16,
    fontSize: 18,
    color: '#cbd5e1',
  },
  ctaRow: {
    marginTop: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    padding: '12px 18px',
    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
    color: '#0b0f1a',
    fontWeight: 700,
    textDecoration: 'none',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(6, 182, 212, 0.25)',
    transition: 'transform 200ms ease, filter 200ms ease',
  },
  secondaryBtn: {
    padding: '12px 18px',
    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(6, 182, 212, 0.15))',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    color: '#e5e7eb',
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: 12,
    backdropFilter: 'blur(6px)',
    transition: 'transform 200ms ease, filter 200ms ease',
  },
  statsRow: {
    marginTop: 48,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  card: {
    position: 'relative',
    padding: 20,
    background: 'rgba(2, 6, 23, 0.55)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    inset: -2,
    background: 'radial-gradient(600px 200px at 10% -20%, rgba(99, 102, 241, 0.18), transparent), radial-gradient(500px 200px at 120% 120%, rgba(6, 182, 212, 0.15), transparent)',
    filter: 'blur(12px)',
    zIndex: 0,
  },
  cardTitle: {
    position: 'relative',
    zIndex: 1,
    margin: 0,
    color: '#cbd5e1',
    fontSize: 14,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  cardNumber: {
    position: 'relative',
    zIndex: 1,
    margin: '8px 0 6px',
    fontSize: 28,
    fontWeight: 800,
    color: '#e2e8f0',
  },
  cardDeltaPositive: {
    position: 'relative',
    zIndex: 1,
    color: '#34d399',
    fontSize: 12,
  },
  cardDeltaNeutral: {
    position: 'relative',
    zIndex: 1,
    color: '#94a3b8',
    fontSize: 12,
  },
  features: {
    padding: '20px 24px 60px',
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  widgets: {
    padding: '20px 24px 60px',
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
  },
  widgetCardOuter: {
    position: 'relative',
    padding: 1,
    borderRadius: 18,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.35))',
  },
  widgetCardInner: {
    background: 'rgba(2, 6, 23, 0.65)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
  },
  widgetTitle: {
    margin: '0 0 12px',
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: 700,
  },
  widgetEmpty: {
    color: '#94a3b8',
    margin: 0,
  },
  orderList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  orderItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '14px 16px',
    borderRadius: 16,
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
  },
  orderHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderUser: {
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: 16,
  },
  orderMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  orderFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderDate: {
    color: '#94a3b8',
    fontSize: 12,
  },
  orderPrice: {
    color: '#e2e8f0',
    fontWeight: 700,
  },
  orderStatus: {
    minWidth: 64,
    height: 22,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 0,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 11,
    lineHeight: '11px',
    fontWeight: 600,
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(148, 163, 184, 0.08)',
  },
  statusCanceled: { color: '#f3a5b0', background: 'rgba(239, 68, 68, 0.10)', borderColor: 'rgba(239,68,68,0.22)' },
  statusPaid: { color: '#a7f3d0', background: 'rgba(34, 197, 94, 0.10)', borderColor: 'rgba(34,197,94,0.22)' },
  statusCheckedOut: { color: '#a5d8ff', background: 'rgba(59, 130, 246, 0.10)', borderColor: 'rgba(59,130,246,0.22)' },
  statusPending: { color: '#c7d2fe', background: 'rgba(99, 102, 241, 0.10)', borderColor: 'rgba(99,102,241,0.22)' },
  lowList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  lowItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
  },
  lowLeft: {},
  lowRight: {},
  lowHotel: { color: '#e2e8f0', fontWeight: 600 },
  lowRoom: { color: '#94a3b8', fontSize: 12 },
  badgeWarn: {
    background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.25), rgba(251, 146, 60, 0.25))',
    color: '#fdba74',
    border: '1px solid rgba(234, 88, 12, 0.35)',
    padding: '4px 10px',
    borderRadius: 999,
    fontWeight: 700,
  },
  quickCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  quickItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    textDecoration: 'none',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: 14,
    padding: '12px 14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
    transition: 'transform 160ms ease, box-shadow 160ms ease',
    color: '#e2e8f0',
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0b0f1a',
    fontWeight: 900,
  },
  quickLabel: {
    flex: 1,
    fontWeight: 700,
  },
  quickChevron: {
    color: '#94a3b8',
    fontSize: 18,
    paddingLeft: 6,
  },
  featureItem: {
    background: 'rgba(2, 6, 23, 0.55)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  featureTitle: {
    margin: '4px 0 6px',
    fontSize: 18,
    color: '#e2e8f0',
  },
  featureDesc: {
    margin: 0,
    color: '#94a3b8',
    lineHeight: 1.6,
  },
};

export default Home;


