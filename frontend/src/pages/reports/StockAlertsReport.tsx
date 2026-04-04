import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Tag, Select, Space, Button, Spin, Empty, Badge } from 'antd';
import { ArrowLeftOutlined, WarningOutlined, BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;

interface StockAlert {
  id: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING' | 'OVERSTOCK' | 'REORDER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  profile_id: string;
  profile_name: string;
  warehouse_id: string;
  warehouse_name: string;
  current_quantity: number;
  threshold_value: number;
  message: string;
  is_active: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

interface AlertSummary {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  byType: { type: string; count: number }[];
}

const StockAlertsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { perPage: '500' };
      
      if (!showActiveOnly) {
        // Get all alerts
      }
      
      const alertsResponse = await api.get<{ data: StockAlert[] }>('/stock/stock-alerts', { params });
      const warehousesResponse = await api.get<{ data: { id: string; name: string }[] }>('/stock/warehouses');
      
      let items = alertsResponse.data.data || [];
      setWarehouses(warehousesResponse.data.data || []);
      
      // Filter by warehouse
      if (selectedWarehouse) {
        items = items.filter(a => a.warehouse_id === selectedWarehouse);
      }
      
      setAlerts(items);
      
      // Calculate summary
      const activeAlerts = items.filter(a => a.is_active);
      const acknowledgedAlerts = items.filter(a => a.is_acknowledged);
      
      const typeMap = new Map<string, number>();
      items.forEach(alert => {
        typeMap.set(alert.alert_type, (typeMap.get(alert.alert_type) || 0) + 1);
      });
      
      setSummary({
        totalAlerts: items.length,
        activeAlerts: activeAlerts.length,
        acknowledgedAlerts: acknowledgedAlerts.length,
        criticalCount: items.filter(a => a.severity === 'CRITICAL').length,
        warningCount: items.filter(a => a.severity === 'WARNING').length,
        infoCount: items.filter(a => a.severity === 'INFO').length,
        byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { label: 'Critique', color: 'red', icon: <ExclamationCircleOutlined /> };
      case 'WARNING':
        return { label: 'Avertissement', color: 'orange', icon: <WarningOutlined /> };
      case 'INFO':
        return { label: 'Information', color: 'blue', icon: <BellOutlined /> };
      default:
        return { label: severity, color: 'default', icon: null };
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return { label: 'Stock bas', color: 'orange' };
      case 'OUT_OF_STOCK':
        return { label: 'Rupture', color: 'red' };
      case 'EXPIRING':
        return { label: 'Expirant', color: 'purple' };
      case 'OVERSTOCK':
        return { label: 'Surstock', color: 'cyan' };
      case 'REORDER':
        return { label: 'Réapprovisionnement', color: 'blue' };
      default:
        return { label: type, color: 'default' };
    }
  };

  const columns = [
    {
      title: 'Sévérité',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const info = getSeverityInfo(severity);
        return (
          <Badge 
            status={severity === 'CRITICAL' ? 'error' : severity === 'WARNING' ? 'warning' : 'processing'} 
            text={<span style={{ color: info.color }}>{info.label}</span>}
          />
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 150,
      render: (type: string) => {
        const info = getTypeInfo(type);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Profil',
      dataIndex: 'profile_name',
      key: 'profile_name',
      width: 180,
    },
    {
      title: 'Entrepôt',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 120,
    },
    {
      title: 'Qté actuelle',
      dataIndex: 'current_quantity',
      key: 'current_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: 'Seuil',
      dataIndex: 'threshold_value',
      key: 'threshold_value',
      width: 80,
      align: 'right' as const,
      render: (val: number) => val?.toLocaleString() || 0,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Actif',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 70,
      render: (active: boolean) => active ? <Tag color="green">Oui</Tag> : <Tag>Non</Tag>,
    },
    {
      title: 'Acquitté',
      dataIndex: 'is_acknowledged',
      key: 'is_acknowledged',
      width: 100,
      render: (ack: boolean, record: StockAlert) => (
        ack ? (
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            {record.acknowledged_by || '-'}
          </Tag>
        ) : (
          <Tag>Non</Tag>
        )
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a: StockAlert, b: StockAlert) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <Layout title="Rapport - Alertes de Stock" subtitle="Alertes de stock bas et rupture">
      <div className="stock-alerts-report">
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
                    title="Total alertes"
                    value={summary?.totalAlerts || 0}
                    prefix={<BellOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Alertes actives"
                    value={summary?.activeAlerts || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Critiques"
                    value={summary?.criticalCount || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Avertissements"
                    value={summary?.warningCount || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
              <Space wrap>
                <Text>Filtrer par entrepôt:</Text>
                <Select
                  style={{ width: 200 }}
                  placeholder="Tous les entrepôts"
                  allowClear
                  value={selectedWarehouse}
                  onChange={(value) => { setSelectedWarehouse(value); fetchData(); }}
                >
                  {warehouses.map(wh => (
                    <Select.Option key={wh.id} value={wh.id}>{wh.name}</Select.Option>
                  ))}
                </Select>
                <Button onClick={() => { setSelectedWarehouse(null); fetchData(); }}>Effacer</Button>
              </Space>
            </Card>

            {/* Data Table */}
            <Card>
              {alerts.length === 0 ? (
                <Empty description="Aucune alerte de stock disponible" />
              ) : (
                <Table
                  dataSource={alerts}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} alertes` }}
                  scroll={{ x: 1200 }}
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

export default StockAlertsReport;
