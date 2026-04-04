import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Tag, Select, Space, Button, Spin, Empty, Progress, Tabs } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;

interface InventoryCount {
  id: string;
  count_number: string;
  warehouse_id: string;
  warehouse_name: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  planned_date: string;
  started_at?: string;
  completed_at?: string;
  total_lines: number;
  counted_lines: number;
  approved_lines: number;
  discrepancies: number;
  created_by?: string;
  created_at: string;
}

interface InventoryLine {
  id: string;
  count_id: string;
  profile_id: string;
  profile_name: string;
  location_id: string;
  location_name: string;
  system_quantity: number;
  counted_quantity?: number;
  difference?: number;
  status: 'PENDING' | 'COUNTED' | 'APPROVED' | 'REJECTED';
  counted_by?: string;
  counted_at?: string;
  notes?: string;
}

interface InventorySummary {
  totalCounts: number;
  draft: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalDiscrepancies: number;
}

const InventoryResultsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [lines, setLines] = useState<InventoryLine[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const countsResponse = await api.get<{ data: InventoryCount[] }>('/stock/inventory-counts', { params: { perPage: '100' } });
      const warehousesResponse = await api.get<{ data: { id: string; name: string }[] }>('/stock/warehouses');
      
      const items = countsResponse.data.data || [];
      setCounts(items);
      setWarehouses(warehousesResponse.data.data || []);
      
      // Calculate summary
      setSummary({
        totalCounts: items.length,
        draft: items.filter(i => i.status === 'DRAFT').length,
        inProgress: items.filter(i => ['IN_PROGRESS', 'SUBMITTED', 'APPROVED'].includes(i.status)).length,
        completed: items.filter(i => i.status === 'COMPLETED').length,
        cancelled: items.filter(i => i.status === 'CANCELLED').length,
        totalDiscrepancies: items.reduce((sum, i) => sum + (i.discrepancies || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLines = async (countId: string) => {
    try {
      const response = await api.get<{ data: InventoryLine[] }>(`/stock/inventory-counts/${countId}/lines`);
      setLines(response.data.data || []);
    } catch (error) {
      console.error('Error fetching lines:', error);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Brouillon', color: 'default', icon: <ClockCircleOutlined /> };
      case 'IN_PROGRESS':
        return { label: 'En cours', color: 'processing', icon: <SyncOutlined spin /> };
      case 'SUBMITTED':
        return { label: 'Soumis', color: 'orange', icon: <ClockCircleOutlined /> };
      case 'APPROVED':
        return { label: 'Approuvé', color: 'blue', icon: <CheckCircleOutlined /> };
      case 'COMPLETED':
        return { label: 'Terminé', color: 'green', icon: <CheckCircleOutlined /> };
      case 'CANCELLED':
        return { label: 'Annulé', color: 'red', icon: <CloseCircleOutlined /> };
      default:
        return { label: status, color: 'default', icon: null };
    }
  };

  const getLineStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'En attente', color: 'default' };
      case 'COUNTED':
        return { label: 'Compté', color: 'processing' };
      case 'APPROVED':
        return { label: 'Approuvé', color: 'success' };
      case 'REJECTED':
        return { label: 'Rejeté', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  };

  const countColumns = [
    {
      title: 'N° Inventaire',
      dataIndex: 'count_number',
      key: 'count_number',
      width: 140,
    },
    {
      title: 'Entrepôt',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 120,
    },
    {
      title: 'Date planifiée',
      dataIndex: 'planned_date',
      key: 'planned_date',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
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
      title: 'Lignes total',
      dataIndex: 'total_lines',
      key: 'total_lines',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Lignes comptées',
      dataIndex: 'counted_lines',
      key: 'counted_lines',
      width: 120,
      align: 'center' as const,
      render: (counted: number, record: InventoryCount) => (
        <Progress 
          percent={record.total_lines > 0 ? Math.round((counted / record.total_lines) * 100) : 0} 
          size="small"
          format={() => `${counted}/${record.total_lines}`}
        />
      ),
    },
    {
      title: 'Écarts',
      dataIndex: 'discrepancies',
      key: 'discrepancies',
      width: 100,
      align: 'center' as const,
      render: (disc: number) => disc > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{disc}</span> : disc,
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
      width: 140,
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  const lineColumns = [
    {
      title: 'Profil',
      dataIndex: 'profile_name',
      key: 'profile_name',
      width: 180,
    },
    {
      title: 'Emplacement',
      dataIndex: 'location_name',
      key: 'location_name',
      width: 100,
    },
    {
      title: 'Qté système',
      dataIndex: 'system_quantity',
      key: 'system_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: 'Qté comptée',
      dataIndex: 'counted_quantity',
      key: 'counted_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: 'Différence',
      dataIndex: 'difference',
      key: 'difference',
      width: 100,
      align: 'right' as const,
      render: (diff: number) => {
        if (diff === undefined || diff === 0) return '-';
        const color = diff > 0 ? '#52c41a' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{diff > 0 ? '+' : ''}{diff}</span>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = getLineStatusInfo(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Compté par',
      dataIndex: 'counted_by',
      key: 'counted_by',
      width: 120,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
    },
  ];

  const tabItems = [
    {
      key: 'summary',
      label: 'Résumé',
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total inventaires"
                  value={summary?.totalCounts || 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Brouillons"
                  value={summary?.draft || 0}
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
                  title="Terminés"
                  value={summary?.completed || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
          <Card>
            {counts.length === 0 ? (
              <Empty description="Aucun inventaire disponible" />
            ) : (
              <Table
                dataSource={counts}
                columns={countColumns}
                rowKey="id"
                rowSelection={{
                  selectedRowKeys: selectedCount ? [selectedCount.id] : [],
                  onChange: (_selectedRowKeys, selectedRows) => {
                    if (selectedRows.length > 0) {
                      const count = selectedRows[0] as InventoryCount;
                      setSelectedCount(count);
                      fetchLines(count.id);
                      setActiveTab('details');
                    }
                  }
                }}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            )}
          </Card>
        </>
      ),
    },
    {
      key: 'details',
      label: 'Détails',
      children: selectedCount ? (
        <Card 
          title={`Inventaire #${selectedCount.count_number} - ${selectedCount.warehouse_name}`}
          extra={
            <Button onClick={() => setSelectedCount(null)}>Fermer</Button>
          }
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title="Statut" value={getStatusInfo(selectedCount.status).label} />
            </Col>
            <Col span={6}>
              <Statistic title="Lignes" value={`${selectedCount.counted_lines}/${selectedCount.total_lines}`} />
            </Col>
            <Col span={6}>
              <Statistic title="Approuvées" value={selectedCount.approved_lines} />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Écarts" 
                value={selectedCount.discrepancies} 
                valueStyle={{ color: selectedCount.discrepancies > 0 ? '#ff4d4f' : '#52c41a' }} 
              />
            </Col>
          </Row>
          {lines.length === 0 ? (
            <Empty description="Aucune ligne disponible" />
          ) : (
            <Table
              dataSource={lines}
              columns={lineColumns}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 900 }}
              size="small"
            />
          )}
        </Card>
      ) : (
        <Empty description="Sélectionnez un inventaire pour voir les détails" />
      ),
    },
  ];

  return (
    <Layout title="Rapport - Inventaire" subtitle="Résultats des comptages d'inventaire">
      <div className="inventory-results-report">
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
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        )}
      </div>
    </Layout>
  );
};

export default InventoryResultsReport;
