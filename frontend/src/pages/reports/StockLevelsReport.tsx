import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Tag, Select, Space, Button, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, StockOutlined, WarningOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;

interface StockItem {
  id: string;
  profile_id: string;
  profile_name: string;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_name: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  minimum_quantity: number;
  reorder_point: number;
  unit: string;
  last_movement_date?: string;
}

interface StockSummary {
  totalItems: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  warehouseCounts: { warehouse: string; count: number; quantity: number }[];
}

const StockLevelsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch inventory items
      const inventoryResponse = await api.get<{ data: StockItem[] }>('/stock/inventory', {
        params: { perPage: 1000 }
      });
      
      // Fetch warehouses for filter
      const warehousesResponse = await api.get<{ data: { id: string; name: string }[] }>('/stock/warehouses');
      
      const items = inventoryResponse.data.data || [];
      setStockData(items);
      setWarehouses(warehousesResponse.data.data || []);
      
      // Calculate summary
      const lowStock = items.filter((item: StockItem) => item.quantity <= (item.reorder_point || 0));
      const outOfStock = items.filter((item: StockItem) => item.quantity === 0);
      
      // Group by warehouse
      const warehouseMap = new Map<string, { count: number; quantity: number }>();
      items.forEach((item: StockItem) => {
        const wh = item.warehouse_name || 'Unknown';
        const current = warehouseMap.get(wh) || { count: 0, quantity: 0 };
        warehouseMap.set(wh, {
          count: current.count + 1,
          quantity: current.quantity + (item.quantity || 0)
        });
      });
      
      const warehouseCounts = Array.from(warehouseMap.entries()).map(([warehouse, data]) => ({
        warehouse,
        ...data
      }));
      
      setSummary({
        totalItems: items.length,
        totalQuantity: items.reduce((sum: number, item: StockItem) => sum + (item.quantity || 0), 0),
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        warehouseCounts
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: StockItem): { status: string; color: string } => {
    if (item.quantity === 0) return { status: 'Rupture', color: 'red' };
    if (item.quantity <= (item.reorder_point || 0)) return { status: 'Seuil bas', color: 'orange' };
    if (item.quantity <= (item.minimum_quantity || 0)) return { status: 'Attention', color: 'gold' };
    return { status: 'Normal', color: 'green' };
  };

  const filteredData = selectedWarehouse
    ? stockData.filter(item => item.warehouse_id === selectedWarehouse)
    : stockData;

  const columns = [
    {
      title: 'Profil',
      dataIndex: 'profile_name',
      key: 'profile_name',
      fixed: 'left' as const,
      width: 180,
    },
    {
      title: 'Entrepôt',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 120,
    },
    {
      title: 'Emplacement',
      dataIndex: 'location_name',
      key: 'location_name',
      width: 100,
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: StockItem) => (
        <span style={{ fontWeight: qty <= (record.reorder_point || 0) ? 600 : 400 }}>
          {qty?.toLocaleString() || 0} {record.unit || 'u'}
        </span>
      ),
    },
    {
      title: 'Réservé',
      dataIndex: 'reserved_quantity',
      key: 'reserved_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: 'Disponible',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: 'Seuil minimum',
      dataIndex: 'minimum_quantity',
      key: 'minimum_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: 'Point de commande',
      dataIndex: 'reorder_point',
      key: 'reorder_point',
      width: 120,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: 'Statut',
      key: 'status',
      width: 100,
      render: (_: unknown, record: StockItem) => {
        const { status, color } = getStockStatus(record);
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Dernier mouvement',
      dataIndex: 'last_movement_date',
      key: 'last_movement_date',
      width: 140,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
  ];

  return (
    <Layout title="Rapport - État du Stock" subtitle="Niveaux de stock par entrepôt">
      <div className="stock-levels-report">
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
                    title="Total articles"
                    value={summary?.totalItems || 0}
                    prefix={<StockOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Quantité totale"
                    value={summary?.totalQuantity || 0}
                    precision={0}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Stock bas"
                    value={summary?.lowStockCount || 0}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Rupture de stock"
                    value={summary?.outOfStockCount || 0}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Filter */}
            <Card style={{ marginBottom: 16 }}>
              <Space>
                <Text>Filtrer par entrepôt:</Text>
                <Select
                  style={{ width: 200 }}
                  placeholder="Tous les entrepôts"
                  allowClear
                  value={selectedWarehouse}
                  onChange={setSelectedWarehouse}
                >
                  {warehouses.map(wh => (
                    <Select.Option key={wh.id} value={wh.id}>{wh.name}</Select.Option>
                  ))}
                </Select>
                <Button onClick={() => setSelectedWarehouse(null)}>Effacer</Button>
              </Space>
            </Card>

            {/* Data Table */}
            <Card>
              {filteredData.length === 0 ? (
                <Empty description="Aucune donnée de stock disponible" />
              ) : (
                <Table
                  dataSource={filteredData}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} articles` }}
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

export default StockLevelsReport;
