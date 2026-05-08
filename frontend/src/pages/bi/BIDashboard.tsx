import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, DollarSign, Activity, 
  AlertTriangle, RefreshCw, Calendar, Download 
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import { biDashboardService, DashboardData, BiDashboard, WidgetData } from '../../services/biApi';

const CHART_COLORS = ['#0d9488', '#1e3a5f', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const BIDashboard: React.FC = () => {
  const [dashboards, setDashboards] = useState<BiDashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<BiDashboard | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (currentDashboard) {
      loadDashboardData(currentDashboard.id);
    }
  }, [currentDashboard, dateRange]);

  const loadDashboards = async () => {
    try {
      const response = await biDashboardService.getDashboards();
      if (response.data.data.length === 0) {
        // Seed default dashboards if none exist
        await biDashboardService.seedDashboards();
        const seededResponse = await biDashboardService.getDashboards();
        setDashboards(seededResponse.data.data);
        if (seededResponse.data.data.length > 0) {
          setCurrentDashboard(seededResponse.data.data[0]);
        }
      } else {
        setDashboards(response.data.data);
        // Set default dashboard (first one)
        const defaultDashboard = response.data.data.find(d => d.isDefault) || response.data.data[0];
        setCurrentDashboard(defaultDashboard);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (id: string) => {
    try {
      setLoading(true);
      const response = await biDashboardService.getDashboardData(id, dateRange);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (preset: string) => {
    const now = new Date();
    let startDate: Date;

    switch (preset) {
      case 'today':
        startDate = now;
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
  };

  const renderWidget = (widget: WidgetData) => {
    const data = widget.data as Record<string, unknown>;
    
    switch (widget.type) {
      case 'kpi_card':
        return renderKPICard(widget, data);
      case 'line_chart':
      case 'area_chart':
        return renderLineChart(widget, data);
      case 'bar_chart':
        return renderBarChart(widget, data);
      case 'pie_chart':
        return renderPieChart(widget, data);
      case 'gauge':
        return renderGauge(widget, data);
      case 'data_table':
        return renderDataTable(widget, data);
      default:
        return <div>Widget type not supported</div>;
    }
  };

  const renderKPICard = (widget: WidgetData, data: Record<string, unknown>) => {
    let value: string | number = 0;
    let trend: number | undefined;

    // Try to extract value from different data structures
    if (data.total !== undefined) {
      value = (data.total as number);
    } else if (data.totalValue !== undefined) {
      value = (data.totalValue as number);
    } else if (data.passRate !== undefined) {
      value = (data.passRate as number);
    } else if (data.avgMargin !== undefined) {
      value = (data.avgMargin as number);
    }

    // Format value based on context
    const isCurrency = widget.title.toLowerCase().includes('revenue') || 
                      widget.title.toLowerCase().includes('cost') ||
                      widget.title.toLowerCase().includes('value') ||
                      widget.title.toLowerCase().includes('margin');
    const isPercent = widget.title.toLowerCase().includes('rate') ||
                      widget.title.toLowerCase().includes('margin');
    
    const formattedValue = isCurrency 
      ? `${(value as number / 1000).toFixed(1)}K DT`
      : isPercent 
        ? `${(value as number).toFixed(1)}%`
        : value;

    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-full">
        <h3 className="text-sm font-medium text-gray-500 mb-2">{widget.title}</h3>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">{formattedValue}</span>
          {trend !== undefined && (
            <span className={`ml-2 flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderLineChart = (widget: WidgetData, data: Record<string, unknown>) => {
    const chartData = (data.monthly || data.overTime || data.ncrTrend || []) as Array<{ month?: string; count?: number; revenue?: number }>;
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-80">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
        <ResponsiveContainer width="100%" height="90%">
          {widget.type === 'area_chart' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="#0d9488" fillOpacity={0.3} />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} />
              <Line type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = (widget: WidgetData, data: Record<string, unknown>) => {
    const chartData = (data.byCustomer || data.byStatus || data.machineStats || []) as Array<{ name?: string; value?: number; count?: number }>;
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-80">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#0d9488" />
            <Bar dataKey="count" fill="#1e3a5f" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = (widget: WidgetData, data: Record<string, unknown>) => {
    const chartData = (data.byCategory || data.byStatus || data.ncrByStatus || []) as Array<{ category?: string; status?: string; value?: number; count?: number }>;
    
    const formattedData = chartData.map((item, index) => ({
      name: item.category || item.status || 'Unknown',
      value: item.value || item.count || 0,
    }));

    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-80">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {formattedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderGauge = (widget: WidgetData, data: Record<string, unknown>) => {
    const value = data.passRate as number || 0;
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-48 flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
        <div className="relative w-32 h-16 overflow-hidden">
          <div className="absolute w-32 h-32 rounded-full border-8 border-gray-200" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 0, 0 0)' }}></div>
          <div 
            className="absolute w-32 h-32 rounded-full border-8 border-green-500" 
            style={{ 
              clipPath: 'polygon(0 50%, 100% 50%, 100% 0, 0 0)',
              transform: `rotate(${(value / 100) * 180}deg)`,
              transformOrigin: '50% 100%'
            }}
          ></div>
        </div>
        <span className="text-2xl font-bold text-gray-900 mt-2">{value.toFixed(1)}%</span>
      </div>
    );
  };

  const renderDataTable = (widget: WidgetData, data: Record<string, unknown>) => {
    const tableData = (data.alerts || data.lowStock || []) as Array<Record<string, unknown>>;
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-80 overflow-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index} className="border-t border-gray-100">
                {Object.values(row).map((value, i) => (
                  <td key={i} className="px-4 py-2 text-sm text-gray-600">
                    {String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading && !dashboardData) {
    return (
      <Layout title="BI Dashboards">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9488]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BI Dashboards" subtitle="Tableaux de bord analytiques avancés">
      {/* Dashboard Selector */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={currentDashboard?.id || ''}
          onChange={(e) => {
            const dashboard = dashboards.find(d => d.id === e.target.value);
            setCurrentDashboard(dashboard || null);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
        >
          {dashboards.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Date Range Presets */}
        <div className="flex gap-2">
          {['today', 'week', 'month', 'quarter', 'year'].map((preset) => (
            <button
              key={preset}
              onClick={() => handleDateRangeChange(preset)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {preset === 'today' ? "Aujourd'hui" :
               preset === 'week' ? 'Semaine' :
               preset === 'month' ? 'Mois' :
               preset === 'quarter' ? 'Trimestre' : 'Année'}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => currentDashboard && loadDashboardData(currentDashboard.id)}
          className="ml-auto px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>

        {/* Export Button */}
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Dashboard Description */}
      {currentDashboard?.description && (
        <p className="text-gray-600 mb-6">{currentDashboard.description}</p>
      )}

      {/* Widgets Grid */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardData.widgets.map((widget) => (
            <div
              key={widget.widgetId}
              className={`${
                widget.type === 'kpi_card' ? 'col-span-1' :
                widget.type === 'data_table' ? 'col-span-2' :
                widget.type === 'line_chart' || widget.type === 'area_chart' ? 'col-span-2' :
                'col-span-1'
              }`}
            >
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && dashboardData && dashboardData.widgets.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun widget</h3>
          <p className="text-gray-500">Ce tableau de bord n'a pas encore de widgets configurés.</p>
        </div>
      )}
    </Layout>
  );
};

export default BIDashboard;
