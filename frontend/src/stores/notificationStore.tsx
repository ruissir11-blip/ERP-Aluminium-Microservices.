import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import maintenanceApi from '../services/maintenance/maintenanceApi';
import { WorkOrder, MaintenancePlan, Machine } from '../types/maintenance.types';

export interface Notification {
  id: string;
  type: 'breakdown' | 'maintenance_due' | 'work_order_overdue' | 'info';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const fetchNotifications = async () => {
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // User not logged in, skip fetching notifications
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      const newNotifications: Notification[] = [];

      // Check for broken down machines
      try {
        const brokenMachines = await maintenanceApi.machine.getBrokenDown();
        if (!isMountedRef.current) return;
        brokenMachines.data.data.forEach((machine: Machine) => {
          newNotifications.push({
            id: `breakdown-${machine.id}`,
            type: 'breakdown',
            title: 'Machine en panne',
            message: `${machine.designation} nécessite une intervention immédiate`,
            severity: 'critical',
            timestamp: new Date().toISOString(),
            read: false,
            link: '/maintenance/work-orders',
          });
        });
      } catch {
        // Ignore
      }

      // Check for overdue work orders
      try {
        const overdueWO = await maintenanceApi.workOrder.getOverdue();
        overdueWO.data.data.forEach((wo: WorkOrder) => {
          newNotifications.push({
            id: `overdue-${wo.id}`,
            type: 'work_order_overdue',
            title: 'Work Order en retard',
            message: `${wo.workOrderNumber} - ${wo.title} (Échéance dépassée)`,
            severity: 'warning',
            timestamp: wo.scheduledDate || wo.createdAt,
            read: false,
            link: '/maintenance/work-orders',
          });
        });
      } catch {
        // Ignore
      }

      // Check for upcoming maintenance (due in 7 days)
      try {
        const duePlans = await maintenanceApi.maintenancePlan.getDue(7);
        duePlans.data.data.forEach((plan: MaintenancePlan) => {
          newNotifications.push({
            id: `due-${plan.id}`,
            type: 'maintenance_due',
            title: 'Maintenance à venir',
            message: `${plan.machine?.designation || 'Machine'} - ${plan.description} prévue dans les 7 jours`,
            severity: 'info',
            timestamp: plan.nextDueDate || new Date().toISOString(),
            read: false,
            link: '/maintenance/plans',
          });
        });
      } catch {
        // Ignore
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;
    
    // Delay initial fetch to avoid overwhelming the API on mount
    const timeoutId = setTimeout(() => {
      fetchNotifications();
    }, 1000);
    
    // Refresh every 60 seconds - but only if not already fetching
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchNotifications();
      }
    }, 60000);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const refresh = () => {
    fetchNotifications();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
