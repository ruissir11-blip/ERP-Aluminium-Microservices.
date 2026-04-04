import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, Select, Space, Button, DatePicker } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, ToolOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface CorrectiveAction {
  id: string;
  action_number: string;
  title: string;
  description?: string;
  type: 'PREVENTIVE' | 'CORRECTIVE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  nc_number?: string;
  assigned_to_name?: string;
  due_date: string;
  completed_at?: string;
  verified_at?: string;
  effectiveness_notes?: string;
  created_by?: string;
  created_at: string;
}

interface Summary {
  totalActions: number;
  pending: number;
  inProgress: number;
  completed: number;
  verified: number;
  overdue: number;
}

const CorrectiveActionsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: CorrectiveAction[] }>('/quality/corrective-actions', { 
        params: { perPage: '500' } 
      });
      let items = response.data.data || [];
      
      // Apply filters
      if (statusFilter) {
        items = items.filter(a => a.status === statusFilter);
      }
      if (typeFilter) {
        items = items.filter(a => a.type === typeFilter);
      }
      if (dateRange) {
        items = items.filter(a => {
          const date = new Date(a.created_at);
          return date >= new Date(dateRange[0]) && date <= new Date(dateRange[1]);
        });
      }
      
      setActions(items);
      
      const now = new Date();
      const overdue = items.filter(a => 
        a.status !== 'COMPLETED' && a.status !== 'VERIFIED' && new Date(a.due_date) < now
      ).length;
      
      setSummary({
        totalActions: items.length,
        pending: items.filter(a => a.status === 'PENDING').length,
        inProgress: items.filter(a => a.status === 'IN_PROGRESS').length,
        completed: items.filter(a => a.status === 'COMPLETED').length,
        verified: items.filter(a => a.status === 'VERIFIED').length,
        overdue,
      });
    } catch (error) {
      console.error('Error fetching corrective actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'En attente', color: 'default', icon: <ClockCircleOutlined /> };
      case 'IN_PROGRESS':
        return { label: 'En cours', color: 'processing', icon: <ToolOutlined /> };
      case 'COMPLETED':
        return { label: 'Terminé', color: 'success', icon: <CheckCircleOutlined /> };
      case 'VERIFIED':
        return { label: 'Vérifié', color: 'green', icon: <CheckCircleOutlined /> };
      case 'CANCELLED':
        return { label: 'Annulé', color: 'error' };
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

  const columns = [
    {
      title: 'N° Action',
      dataIndex: 'action_number',
      key: 'action_number',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'PREVENTIVE' ? 'blue' : 'red'}>
          {type === 'PREVENTIVE' ? 'Préventive' : 'Corrective'}
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
      title: 'NC associée',
      dataIndex: 'nc_number',
      key: 'nc_number',
      width: 100,
      render: (nc: string) => nc || '-',
    },
    {
      title: 'Assigné à',
      dataIndex: 'assigned_to_name',
      key: 'assigned_to_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: 'Date limite',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      sorter: (a: CorrectiveAction, b: CorrectiveAction) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      render: (date: string, record: CorrectiveAction) => {
        const isOverdue = record.status !== 'COMPLETED' && record.status !== 'VERIFIED' && new Date(date) < new Date();
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {new Date(date).toLocaleDateString('fr-FR')}
            {isOverdue && <WarningOutlined style={{ marginLeft: 4, color: '#ff4d4f' }} />}
          </span>
        );
      },
    },
    {
      title: 'Date terminée',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
    {
      title: 'Vérifié le',
      dataIndex: 'verified_at',
      key: 'verified_at',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
    {
      title: 'Créé par',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 120,
    },
  ];

  return (
    <Layout title="Rapport - Actions Correctives" subtitle="Suivi des actions préventives et correctives">
      <div className="corrective-actions-report">
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
                    title="Total actions"
                    value={summary?.totalActions || 0}
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
                <Text>Type:</Text>
                <Select
                  style={{ width: 150 }}
                  placeholder="Tous"
                  allowClear
                  value={typeFilter}
                  onChange={(value) => { setTypeFilter(value); fetchData(); }}
                >
                  <Select.Option value="PREVENTIVE">Préventive</Select.Option>
                  <Select.Option value="CORRECTIVE">Corrective</Select.Option>
                </Select>
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
                  <Select.Option value="VERIFIED">Vérifié</Select.Option>
                  <Select.Option value="CANCELLED">Annulé</Select.Option>
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
                <Button onClick={() => { setStatusFilter(null); setTypeFilter(null); setDateRange(null); fetchData(); }}>Effacer</Button>
              </Space>
            </Card>

            {/* Data Table */}
            <Card>
              {actions.length === 0 ? (
                <Empty description="Aucune action corrective disponible" />
              ) : (
                <Table
                  dataSource={actions}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} actions` }}
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

export default CorrectiveActionsReport;
