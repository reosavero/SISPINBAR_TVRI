// ============================================
// NOTIFICATION CONTEXT - Sistem Peminjaman Barang TVRI
// Admin: Grouped per Pegawai per Tipe Aksi
// Pegawai: Semua notifikasi (read + unread), tetap tampil setelah dibaca
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const pollingRef = useRef(null);
  const dropdownRef = useRef(null);

  // ============ PEGAWAI: SEMUA NOTIFIKASI ============
  const [pegawaiNotifs, setPegawaiNotifs] = useState([]);
  const [pegawaiUnreadCount, setPegawaiUnreadCount] = useState(0);
  const [pegawaiNotifLoading, setPegawaiNotifLoading] = useState(false);

  // Fetch ALL notifications for pegawai (read + unread)
  const fetchPegawaiNotifications = useCallback(async () => {
    if (!user?.id || isAdmin) return;
    if (!sessionStorage.getItem('token')) return;
    try {
      const res = await api.get('/notifications/pegawai', { params: { limit: 30 } });
      if (res.data?.success) {
        setPegawaiNotifs(res.data.data || []);
        setPegawaiUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      // silently fail
    }
  }, [user?.id, isAdmin]);

  // Mark single pegawai notification as read — hilangkan dari daftar
  const markPegawaiNotifRead = useCallback(async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      // Hapus dari daftar lokal
      setPegawaiNotifs(prev => prev.filter(n => n.id !== notifId));
      setPegawaiUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  // Mark all pegawai notifications as read — NOTIFIKASI HILANG DARI DAFTAR
  const markAllPegawaiNotifRead = useCallback(async () => {
    try {
      await api.put('/notifications/mark-all-read');
      // Kosongkan daftar notifikasi & badge
      setPegawaiNotifs([]);
      setPegawaiUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  // ============ ADMIN: NOTIFIKASI ============

  // Fetch notifications from API (admin only) — returns grouped data
  const fetchNotifications = useCallback(async () => {
    if (!user || !isAdmin) return;
    if (!sessionStorage.getItem('token')) return;
    try {
      const res = await api.get('/notifications', { params: { limit: 50 } });
      if (!user) return;
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to fetch notifications:', err);
    }
  }, [user, isAdmin]);

  // Fetch unread count only (admin only)
  const fetchUnreadCount = useCallback(async () => {
    if (!user || !isAdmin) return;
    if (!sessionStorage.getItem('token')) return;
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.data?.unreadCount || 0);
      }
    } catch (err) {
      // silently fail
    }
  }, [user, isAdmin]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notifId) => {
    if (!isAdmin) return;
    try {
      await api.put(`/notifications/${notifId}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [isAdmin, fetchNotifications]);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (ids) => {
    if (!isAdmin || !ids || ids.length === 0) return;
    try {
      await api.put('/notifications/mark-multiple-read', { ids });
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark multiple notifications as read:', err);
    }
  }, [isAdmin, fetchNotifications]);

  // Mark all admin notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAdmin) return;
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications([]);
      setUnreadCount(0);
      setExpandedGroups(new Set());
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [isAdmin]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Mark all items in a group as read
  const markGroupAsRead = useCallback(async (group) => {
    if (!group?.is_group || !group.items) return;
    const ids = group.items.map(item => item.id);
    await markMultipleAsRead(ids);
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.delete(group.id);
      return next;
    });
    toast.success(`${group.group_count} notifikasi ditandai dibaca`);
  }, [markMultipleAsRead]);

  // ============ INIT & POLLING ============

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setPegawaiNotifs([]);
      setPegawaiUnreadCount(0);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    if (isAdmin) {
      fetchNotifications();
    } else if (user.id) {
      fetchPegawaiNotifications();
    }

    // Poll every 30 seconds
    pollingRef.current = setInterval(() => {
      if (isAdmin) {
        fetchUnreadCount();
      } else if (user.id) {
        fetchPegawaiNotifications();
      }
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [user, isAdmin, fetchNotifications, fetchUnreadCount, fetchPegawaiNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh notifications
  const refresh = useCallback(async () => {
    if (isAdmin) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    } else if (user?.id) {
      setPegawaiNotifLoading(true);
      await fetchPegawaiNotifications();
      setPegawaiNotifLoading(false);
    }
  }, [isAdmin, fetchNotifications, user?.id, fetchPegawaiNotifications]);

  const value = {
    // Admin notifications
    notifications,
    unreadCount,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    loading,
    expandedGroups,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    markGroupAsRead,
    toggleGroup,
    refresh,
    // Pegawai notifications
    pegawaiNotifs,
    pegawaiUnreadCount,
    pegawaiNotifLoading,
    markPegawaiNotifRead,
    markAllPegawaiNotifRead,
    fetchPegawaiNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;