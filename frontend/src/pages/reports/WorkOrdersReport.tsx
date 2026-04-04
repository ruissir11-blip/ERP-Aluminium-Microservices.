import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, Select, Space, Button, DatePicker } from 'antd';
import { ArrowLeftOutlined, ToolOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description?: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  machine_id: string;
  machine_name: string;
  assigned_to_name?: string;
  scheduled_date: string;
  completed_at?: string;
  estimated_duration?: number;
  actual_duration?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

interface OrdersSummary {
  totalOrders: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  byPriority: { priority: string; count: number }[];
}

const WorkOrdersReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { perPage: '500' };
      
      const response = await api.get<{ data: WorkOrder[] }>('/maintenance/work-orders', { params });
      let items = response.data.data || [];
      
      // Apply filters
      if (statusFilter) {
        items = items.filter(o => o.status === statusFilter);
      }
      if (priorityFilter) {
        items = items.filter(o => o.priority === priorityFilter);
      }
      if (dateRange) {
        items = items.filter(o => {
          const date = new Date(o.scheduled_date);
          return date >= new Date(dateRange[0]) && date <= new Date(dateRange[1]);
        });
      }
      
      setWorkOrders(items);
      
      // Calculate summary
      const now = new Date();
      const overdue = items.filter(o => 
        o.status === 'PENDING' && new Date(o.scheduled_date) < now
      ).length;
      
      const priorityMap = new Map<string, number>();
      items.forEach(order => {
        priorityMap.set(order.priority, (priorityMap.get(order.priority) || 0) + 1);
      });
      
      setSummary({
        totalOrders: items.length,
        pending: items.filter(o => o.status === 'PENDING').length,
        inProgress: items.filter(o => o.status === 'IN_PROGRESS').length,
        completed: items.filter(o => ['COMPLETED', 'CLOSED'].includes(o.status)).length,
        cancelled: items.filter(o => o.status === 'CANCELLED').length,
        overdue,
        byPriority: Array.from(priorityMap.entries()).map(([priority, count]) => ({ priority, count })),
      });
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'En attente', color: 'default', icon: <ClockCircleOutlined /> };
      case 'IN_PROGRESS':
        return { label: 'En cours', color: 'processing', icon: <SyncOutlined /> };
      case 'COMPLETED':
        return { label: 'Terminé', color: 'success', icon: <CheckCircleOutlined /> };
      case 'CLOSED':
        return { label: 'Fermé', color: 'default', icon: <CheckCircleOutlined /> };
      case 'CANCELLED':
        return { label: 'Annulé', color: 'error', icon: <CloseCircleOutlined /> };
      default:
        return { label: status, color: 'default', icon: null };
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

  const columns = [
    {
      title: 'N° OT',
      dataIndex: 'work_order_number',
      key: 'work_order_number',
      width: 100,
      fixed: 'left' as const,
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
      render: (type: string) => (
        <Tag color={type === 'PREVENTIVE' ? 'blue' : type === 'CORRECTIVE' ? 'red' : 'purple'}>
          {type === 'PREVENTIVE' ? 'Préventif' : type === 'CORRECTIVE' ? 'Correctif' : 'Prédictif'}
        </Tag>
      ),
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
        const info = getStatusInfo(status);
        return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
      },
    },
    {
      title: 'Assigné à',
      dataIndex: 'assigned_to_name',
      key: 'assigned_to_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: 'Date prévue',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 120,
      sorter: (a: WorkOrder, b: WorkOrder) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime(),
      render: (date: string, record: WorkOrder) => {
        const isOverdue = record.status === 'PENDING' && new Date(date) < new Date();
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {new Date(date).toLocaleDateString('fr-FR')}
            {isOverdue && <WarningOutlined style={{ marginLeft: 4, color: '#ff4d4f' }} />}
          </span>
        );
      },
    },
    {
      title: 'Durée estimée',
      dataIndex: 'estimated_duration',
      key: 'estimated_duration',
      width: 120,
      align: 'right' as const,
      render: (duration: number) => duration ? `${duration} h` : '-',
    },
    {
      title: 'Durée réelle',
      dataIndex: 'actual_duration',
      key: 'actual_duration',
      width: 120,
      align: 'right' as const,
      render: (duration: number) => duration ? `${duration} h` : '-',
    },
    {
      title: 'Créé par',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 120,
    },
    {
      title: 'Créé le',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <Layout title="Rapport - Ordres de Travail" subtitle="Liste et statut des ordres de travail">
      <div className="work-orders-report">
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
                    title="Total ordres"
                    value={summary?.totalOrders || 0}
                    prefix={<ToolOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En attente"
                    value={summary?.pending || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En cours"
                    value={summary?.inProgress || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En retard"
                    value={summary?.overdue || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
              <Space wrap>
                <Text>Statut:</Text>
                <Select
                  style={{ width: 150 }}
                  placeholder="Tous"
                  allowClear
                  value={statusFilter}
                  onChange={(value) => { setStatusFilter(value); fetchData(); }}
                >
                  <Select.Option value="PENDING">En attente</Select.Option>
                  <Select.Option value="IN_PROGRESS">En cours</Select.Option>
                  <Select.Option value="COMPLETED">Terminé</Select.Option>
                  <Select.Option value="CLOSED">Fermé</Select.Option>
                  <Select.Option value="CANCELLED">Annulé</Select.Option>
                </Select>
                <Text>Priorité:</Text>
                <Select
                  style={{ width: 150 }}
                  placeholder="Toutes"
                  allowClear
                  value={priorityFilter}
                  onChange={(value) => { setPriorityFilter(value); fetchData(); }}
                >
                  <Select.Option value="URGENT">Urgent</Select.Option>
                  <Select.Option value="HIGH">Haute</Select.Option>
                  <Select.Option value="MEDIUM">Moyenne</Select.Option>
                  <Select.Option value="LOW">Basse</Select.Option>
                </Select>
                <Text>Période:</Text>
                <RangePicker 
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
                    } else {
                      setDateRange(null);
                    }
                  }} 
                />
                <Button onClick={() => { setStatusFilter(null); setPriorityFilter(null); setDateRange(null); fetchData(); }}>Effacer</Button>
              </Space>
            </Card>

            {/* Data Table */}
            <Card>
              {workOrders.length === 0 ? (
                <Empty description="Aucun ordre de travail disponible" />
              ) : (
                <Table
                  dataSource={workOrders}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} ordres` }}
                  scroll={{ x: 1400 }}
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

export default WorkOrdersReport;
