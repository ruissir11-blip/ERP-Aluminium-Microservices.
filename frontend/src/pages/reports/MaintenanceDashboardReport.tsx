import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, Progress, Button } from 'antd';
import { ArrowLeftOutlined, DashboardOutlined, ToolOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;

interface Machine {
  id: string;
  name: string;
  reference: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'BREAKDOWN' | 'OFFLINE';
  operational_hours?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
}

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  machine_name: string;
  scheduled_date: string;
  completed_at?: string;
  estimated_duration?: number;
  actual_duration?: number;
}

interface DashboardSummary {
  totalMachines: number;
  operational: number;
  maintenance: number;
  breakdown: number;
  totalWorkOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  overdueOrders: number;
}

const MaintenanceDashboardReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch machines
      const machinesResponse = await api.get<{ data: Machine[] }>('/maintenance/machines', { params: { perPage: '100' } });
      // Fetch work orders
      const ordersResponse = await api.get<{ data: WorkOrder[] }>('/maintenance/work-orders', { params: { perPage: '100' } });
      // Fetch overdue work orders
      const overdueResponse = await api.get<{ data: WorkOrder[] }>('/maintenance/work-orders/overdue');
      
      const machinesData = machinesResponse.data.data || [];
      const ordersData = ordersResponse.data.data || [];
      const overdueData = overdueResponse.data.data || [];
      
      setMachines(machinesData);
      setWorkOrders(ordersData);
      
      // Calculate summary
      setSummary({
        totalMachines: machinesData.length,
        operational: machinesData.filter(m => m.status === 'OPERATIONAL').length,
        maintenance: machinesData.filter(m => m.status === 'MAINTENANCE').length,
        breakdown: machinesData.filter(m => m.status === 'BREAKDOWN').length,
        totalWorkOrders: ordersData.length,
        pendingOrders: ordersData.filter(o => o.status === 'PENDING').length,
        inProgressOrders: ordersData.filter(o => o.status === 'IN_PROGRESS').length,
        completedOrders: ordersData.filter(o => ['COMPLETED', 'CLOSED'].includes(o.status)).length,
        overdueOrders: overdueData.length,
      });
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return { label: 'Opérationnel', color: 'success' };
      case 'MAINTENANCE':
        return { label: 'Maintenance', color: 'processing' };
      case 'BREAKDOWN':
        return { label: 'Panne', color: 'error' };
      case 'OFFLINE':
        return { label: 'Hors ligne', color: 'default' };
      default:
        return { label: status, color: 'default' };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { label: 'Urgent', color: 'red' };
      case 'HIGH':
        return { label: 'Haute', color: 'orange' };
      case 'MEDIUM':
        return { label: 'Moyenne', color: 'blue' };
      case 'LOW':
        return { label: 'Basse', color: 'default' };
      default:
        return { label: priority, color: 'default' };
    }
  };

  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'En attente', color: 'default', icon: <ClockCircleOutlined /> };
      case 'IN_PROGRESS':
        return { label: 'En cours', color: 'processing', icon: <ThunderboltOutlined /> };
      case 'COMPLETED':
        return { label: 'Terminé', color: 'success', icon: <CheckCircleOutlined /> };
      case 'CLOSED':
        return { label: 'Fermé', color: 'default', icon: <CheckCircleOutlined /> };
      case 'CANCELLED':
        return { label: 'Annulé', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  };

  const machineColumns = [
    {
      title: 'Machine',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: Machine) => (
        <span>
          <strong>{name}</strong>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.reference}</Text>
        </span>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Heures opérationnelles',
      dataIndex: 'operational_hours',
      key: 'operational_hours',
      width: 150,
      align: 'right' as const,
      render: (hours: number) => hours ? `${hours.toLocaleString()} h` : '-',
    },
    {
      title: 'Dernière maintenance',
      dataIndex: 'last_maintenance_date',
      key: 'last_maintenance_date',
      width: 140,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
    {
      title: 'Prochaine maintenance',
      dataIndex: 'next_maintenance_date',
      key: 'next_maintenance_date',
      width: 140,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
  ];

  const orderColumns = [
    {
      title: 'N° OT',
      dataIndex: 'work_order_number',
      key: 'work_order_number',
      width: 100,
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Machine',
      dataIndex: 'machine_name',
      key: 'machine_name',
      width: 150,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Priorité',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const info = getPriorityInfo(priority);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const info = getOrderStatusInfo(status);
        return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
      },
    },
    {
      title: 'Date prévue',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  // Calculate availability percentage
  const availabilityPercent = summary && summary.totalMachines > 0 
    ? Math.round((summary.operational / summary.totalMachines) * 100) 
    : 0;

  return (
    <Layout title="Rapport - Tableau de Bord Maintenance" subtitle="Vue d'ensemble des indicateurs maintenance">
      <div className="maintenance-dashboard-report">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/reports')}
          style={{ marginBottom: 16 }}
        >
          Retour aux rapports
        </Button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total machines"
                    value={summary?.totalMachines || 0}
                    prefix={<ToolOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Disponibilité"
                    value={availabilityPercent}
                    suffix="%"
                    prefix={<DashboardOutlined />}
                    valueStyle={{ color: availabilityPercent >= 90 ? '#52c41a' : availabilityPercent >= 70 ? '#faad14' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En panne"
                    value={summary?.breakdown || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En maintenance"
                    value={summary?.maintenance || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total ordres de travail"
                    value={summary?.totalWorkOrders || 0}
                    prefix={<ToolOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En attente"
                    value={summary?.pendingOrders || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En cours"
                    value={summary?.inProgressOrders || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En retard"
                    value={summary?.overdueOrders || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Machines Status */}
            <Card title="État des machines" style={{ marginBottom: 16 }}>
              {machines.length === 0 ? (
                <Empty description="Aucune machine disponible" />
              ) : (
                <Table
                  dataSource={machines}
                  columns={machineColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              )}
            </Card>

            {/* Recent Work Orders */}
            <Card title="Ordres de travail récents">
              {workOrders.length === 0 ? (
                <Empty description="Aucun ordre de travail disponible" />
              ) : (
                <Table
                  dataSource={workOrders.slice(0, 20)}
                  columns={orderColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MaintenanceDashboardReport;
