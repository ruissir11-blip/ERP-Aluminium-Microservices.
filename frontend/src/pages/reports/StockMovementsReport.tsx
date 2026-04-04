import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Tag, Select, Space, Button, Spin, Empty, DatePicker } from 'antd';
import { ArrowLeftOutlined, SwapOutlined, ArrowDownOutlined, ArrowUpOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface StockMovement {
  id: string;
  profile_id: string;
  profile_name: string;
  warehouse_id: string;
  warehouse_name: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

interface MovementSummary {
  totalMovements: number;
  totalIn: number;
  totalOut: number;
  transfers: number;
  adjustments: number;
  byWarehouse: { warehouse: string; entries: number; exits: number }[];
}

const StockMovementsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<MovementSummary | null>(null);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { perPage: '1000' };
      
      if (selectedWarehouse) {
        params.warehouseId = selectedWarehouse;
      }
      
      const movementsResponse = await api.get<{ data: StockMovement[] }>('/stock/stock-movements', { params });
      const warehousesResponse = await api.get<{ data: { id: string; name: string }[] }>('/stock/warehouses');
      
      let items = movementsResponse.data.data || [];
      setWarehouses(warehousesResponse.data.data || []);
      
      // Filter by date range if set
      if (dateRange) {
        items = items.filter(m => {
          const date = new Date(m.created_at);
          return date >= new Date(dateRange[0]) && date <= new Date(dateRange[1]);
        });
      }
      
      setMovements(items);
      
      // Calculate summary
      const totalIn = items.filter(m => m.movement_type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
      const totalOut = items.filter(m => m.movement_type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
      const transfers = items.filter(m => m.movement_type === 'TRANSFER').length;
      const adjustments = items.filter(m => m.movement_type === 'ADJUSTMENT').length;
      
      // Group by warehouse
      const warehouseMap = new Map<string, { entries: number; exits: number }>();
      items.forEach(item => {
        const wh = item.warehouse_name || 'Unknown';
        const current = warehouseMap.get(wh) || { entries: 0, exits: 0 };
        if (item.movement_type === 'IN') {
          warehouseMap.set(wh, { ...current, entries: current.entries + 1 });
        } else if (item.movement_type === 'OUT') {
          warehouseMap.set(wh, { ...current, exits: current.exits + 1 });
        }
      });
      
      const byWarehouse = Array.from(warehouseMap.entries()).map(([warehouse, data]) => ({
        warehouse,
        ...data
      }));
      
      setSummary({
        totalMovements: items.length,
        totalIn,
        totalOut,
        transfers,
        adjustments,
        byWarehouse
      });
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case 'IN':
        return { label: 'Entrée', color: 'green', icon: <ArrowDownOutlined /> };
      case 'OUT':
        return { label: 'Sortie', color: 'red', icon: <ArrowUpOutlined /> };
      case 'TRANSFER':
        return { label: 'Transfert', color: 'blue', icon: <SwapOutlined /> };
      case 'ADJUSTMENT':
        return { label: 'Ajustement', color: 'orange', icon: <InboxOutlined /> };
      default:
        return { label: type, color: 'default', icon: null };
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a: StockMovement, b: StockMovement) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (date: string) => new Date(date).toLocaleString('fr-FR'),
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
      title: 'Type',
      dataIndex: 'movement_type',
      key: 'movement_type',
      width: 120,
      render: (type: string) => {
        const info = getMovementTypeInfo(type);
        return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
      },
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: StockMovement) => {
        const prefix = record.movement_type === 'OUT' ? '-' : '+';
        return <span>{prefix}{qty?.toLocaleString()}</span>;
      },
    },
    {
      title: 'Référence',
      dataIndex: 'reference_type',
      key: 'reference',
      width: 120,
      render: (_: unknown, record: StockMovement) => (
        record.reference_type ? `${record.reference_type} #${record.reference_id}` : '-'
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Créé par',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 120,
    },
  ];

  return (
    <Layout title="Rapport - Mouvements de Stock" subtitle="Historique des entrées et sorties">
      <div className="stock-movements-report">
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
                    title="Total mouvements"
                    value={summary?.totalMovements || 0}
                    prefix={<SwapOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total entrées"
                    value={summary?.totalIn || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ArrowDownOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total sorties"
                    value={summary?.totalOut || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Transferts"
                    value={summary?.transfers || 0}
                    valueStyle={{ color: '#1890ff' }}
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
                <Button onClick={() => { setSelectedWarehouse(null); setDateRange(null); fetchData(); }}>Effacer</Button>
              </Space>
            </Card>

            {/* Data Table */}
            <Card>
              {movements.length === 0 ? (
                <Empty description="Aucun mouvement de stock disponible" />
              ) : (
                <Table
                  dataSource={movements}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} mouvements` }}
                  scroll={{ x: 1100 }}
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

export default StockMovementsReport;
