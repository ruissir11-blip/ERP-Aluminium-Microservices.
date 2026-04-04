import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, Wrench } from 'lucide-react';
import Layout from '../../components/common/Layout';
import maintenanceApi from '../../services/maintenance/maintenanceApi';
import { WorkOrder, MaintenancePlan, Machine } from '../../types/maintenance.types';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'work-order' | 'maintenance-plan';
  status: string;
  priority: string;
  machineName: string;
}

const MaintenanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const [workOrdersRes, plansRes] = await Promise.all([
        maintenanceApi.workOrder.getAll({
          scheduledDateFrom: startOfMonth.toISOString().split('T')[0],
          scheduledDateTo: endOfMonth.toISOString().split('T')[0],
        }),
        maintenanceApi.maintenancePlan.getDue(60),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Work orders
      workOrdersRes.data.data.forEach((wo: WorkOrder) => {
        if (wo.scheduledDate) {
          calendarEvents.push({
            id: wo.id,
            title: wo.title,
            date: wo.scheduledDate,
            type: 'work-order',
            status: wo.status,
            priority: wo.priority,
            machineName: wo.machine?.designation || 'Unknown',
          });
        }
      });

      // Maintenance plans (show next due dates)
      plansRes.data.data.forEach((plan: MaintenancePlan) => {
        if (plan.nextDueDate) {
          calendarEvents.push({
            id: `plan-${plan.id}`,
            title: `Plan: ${plan.description}`,
            date: plan.nextDueDate,
            type: 'maintenance-plan',
            status: plan.isActive ? 'ACTIVE' : 'INACTIVE',
            priority: 'ROUTINE',
            machineName: plan.machine?.designation || 'Unknown',
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'MAJOR': return 'bg-orange-500';
      case 'MINOR': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'border-gray-400';
      case 'ASSIGNED': return 'border-blue-400';
      case 'IN_PROGRESS': return 'border-yellow-400';
      case 'COMPLETED': return 'border-green-400';
      case 'CLOSED': return 'border-teal-400';
      case 'ACTIVE': return 'border-green-400';
      default: return 'border-gray-400';
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  // Generate calendar grid
  const calendarDays = [];
  
  // Empty cells for days before the first of the month
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    calendarDays.push(
      <div 
        key={day} 
        className={`h-24 border border-gray-100 p-1 overflow-hidden ${isToday(day) ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
      >
        <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-[#0d9488]' : 'text-gray-700'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`text-xs p-1 rounded cursor-pointer truncate ${getPriorityColor(event.priority)} text-white`}
              title={`${event.title} - ${event.machineName}`}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-xs text-gray-500">+{dayEvents.length - 3} plus</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout title="Calendrier Maintenance" subtitle="Planification visuelle des interventions">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e]"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm rounded-lg ${view === 'month' ? 'bg-[#0d9488] text-white' : 'bg-gray-100'}`}
            >
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm rounded-lg ${view === 'week' ? 'bg-[#0d9488] text-white' : 'bg-gray-100'}`}
            >
              Semaine
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Critique</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Majeur</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Mineur</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Routine</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 border-b border-gray-100">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar body */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Détails de l'intervention</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500">Titre</label>
                <p className="font-medium">{selectedEvent.title}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Machine</label>
                <p className="font-medium">{selectedEvent.machineName}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-sm text-gray-500">Type</label>
                  <p className="font-medium capitalize">{selectedEvent.type.replace('-', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Priorité</label>
                  <p className={`font-medium px-2 py-0.5 rounded text-white text-sm inline-block ${getPriorityColor(selectedEvent.priority)}`}>
                    {selectedEvent.priority}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date</label>
                <p className="font-medium">{new Date(selectedEvent.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Statut</label>
                <p className="font-medium">{selectedEvent.status}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MaintenanceCalendar;
