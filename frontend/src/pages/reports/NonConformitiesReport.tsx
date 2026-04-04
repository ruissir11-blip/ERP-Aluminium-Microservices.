import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, Select, Space, Button, DatePicker } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface NonConformity {
  id: string;
  nc_number: string;
  title: string;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATION' | 'CLOSED';
  type: string;
  lot_number?: string;
  profile_name?: string;
  detected_by?: string;
  created_at: string;
  closed_at?: string;
}

interface Summary {
  totalNC: number;
  open: number;
  investigation: number;
  closed: number;
  critical: number;
  high: number;
}

const NonConformitiesReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: NonConformity[] }>('/quality/non-conformities', { 
        params: { perPage: '500' } 
      });
      let items = response.data.data || [];
      
      // Apply filters
      if (severityFilter) {
        items = items.filter(nc => nc.severity === severityFilter);
      }
      if (statusFilter) {
        items = items.filter(nc => nc.status === statusFilter);
      }
      if (dateRange) {
        items = items.filter(nc => {
          const date = new Date(nc.created_at);
          return date >= new Date(dateRange[0]) && date <= new Date(dateRange[1]);
        });
      }
      
      setNonConformities(items);
      
      setSummary({
        totalNC: items.length,
        open: items.filter(nc => nc.status === 'OPEN').length,
        investigation: items.filter(nc => nc.status === 'INVESTIGATION').length,
        closed: items.filter(nc => nc.status === 'CLOSED').length,
        critical: items.filter(nc => nc.severity === 'CRITICAL').length,
        high: items.filter(nc => nc.severity === 'HIGH').length,
      });
    } catch (error) {
      console.error('Error fetching non-conformities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { label: 'Critique', color: 'red' };
      case 'HIGH':
        return { label: 'Haute', color: 'orange' };
      case 'MEDIUM':
        return { label: 'Moyenne', color: 'blue' };
      case 'LOW':
        return { label: 'Basse', color: 'default' };
      default:
        return { label: severity, color: 'default' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Ouvert', color: 'red', icon: <WarningOutlined /> };
      case 'INVESTIGATION':
        return { label: 'En investigation', color: 'orange', icon: <ClockCircleOutlined /> };
      case 'CLOSED':
        return { label: 'Fermé', color: 'green', icon: <CheckCircleOutlined /> };
      default:
        return { label: status, color: 'default' };
    }
  };

  const columns = [
    {
      title: 'N° NC',
      dataIndex: 'nc_number',
      key: 'nc_number',
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
      width: 120,
    },
    {
      title: 'Sévérité',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      sorter: (a: NonConformity, b: NonConformity) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.severity] || 4) - (order[b.severity] || 4);
      },
      render: (severity: string) => {
        const info = getSeverityInfo(severity);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
      },
    },
    {
      title: 'Lot',
      dataIndex: 'lot_number',
      key: 'lot_number',
      width: 120,
      render: (lot: string) => lot || '-',
    },
    {
      title: 'Profil',
      dataIndex: 'profile_name',
      key: 'profile_name',
      width: 150,
      render: (profile: string) => profile || '-',
    },
    {
      title: 'Détecté par',
      dataIndex: 'detected_by',
      key: 'detected_by',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: 'Date création',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      sorter: (a: NonConformity, b: NonConformity) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Date fermeture',
      dataIndex: 'closed_at',
      key: 'closed_at',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
  ];

  return (
    <Layout title="Rapport - Non-conformités" subtitle="Liste des NC avec filtres par sévérité">
      <div className="non-conformities-report">
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
                    title="Total NC"
                    value={summary?.totalNC || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Ouvertes"
                    value={summary?.open || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="En investigation"
                    value={summary?.investigation || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Critiques"
                    value={summary?.critical || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
              <Space wrap>
                <Text>Sévérité:</Text>
                <Select
                  style={{ width: 150 }}
                  placeholder="Toutes"
                  allowClear
                  value={severityFilter}
                  onChange={(value) => { setSeverityFilter(value); fetchData(); }}
                >
                  <Select.Option value="CRITICAL">Critique</Select.Option>
                  <Select.Option value="HIGH">Haute</Select.Option>
                  <Select.Option value="MEDIUM">Moyenne</Select.Option>
                  <Select.Option value="LOW">Basse</Select.Option>
                </Select>
                <Text>Statut:</Text>
                <Select
                  style={{ width: 180 }}
                  placeholder="Tous"
                  allowClear
                  value={statusFilter}
                  onChange={(value) => { setStatusFilter(value); fetchData(); }}
                >
                  <Select.Option value="OPEN">Ouvert</Select.Option>
                  <Select.Option value="INVESTIGATION">En investigation</Select.Option>
                  <Select.Option value="CLOSED">Fermé</Select.Option>
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
                <Button onClick={() => { setSeverityFilter(null); setStatusFilter(null); setDateRange(null); fetchData(); }}>Effacer</Button>
              </Space>
            </Card>

            {/* Data Table */}
            <Card>
              {nonConformities.length === 0 ? (
                <Empty description="Aucune non-conformité disponible" />
              ) : (
                <Table
                  dataSource={nonConformities}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} NC` }}
                  scroll={{ x: 1300 }}
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

export default NonConformitiesReport;
