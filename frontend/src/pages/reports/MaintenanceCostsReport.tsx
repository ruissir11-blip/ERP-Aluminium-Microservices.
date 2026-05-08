import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, DatePicker, Select, Space, Button } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, ToolOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Machine {
  id: string;
  name: string;
  reference: string;
}

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
  status: string;
  machine_name: string;
  scheduled_date: string;
  completed_at?: string;
  estimated_cost?: number;
  actual_cost?: number;
  labor_hours?: number;
  parts_cost?: number;
}

interface CostSummary {
  totalOrders: number;
  totalCost: number;
  laborHours: number;
  partsCost: number;
  preventiveCost: number;
  correctiveCost: number;
  byMachine: { machine: string; cost: number }[];
}

const MaintenanceCostsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const ordersResponse = await api.get<{ data: WorkOrder[] }>('/maintenance/work-orders', { 
        params: { perPage: '500', status: 'COMPLETED' } 
      });
      const machinesResponse = await api.get<{ data: Machine[] }>('/maintenance/machines/active');
      
      const ordersData = ordersResponse.data.data || [];
      const machinesData = machinesResponse.data.data || [];
      
      setMachines(machinesData);
      
      // Filter by machine and date
      let filteredOrders = ordersData;
      if (selectedMachine) {
        filteredOrders = filteredOrders.filter(o => o.machine_name === machinesData.find(m => m.id === selectedMachine)?.name);
      }
      if (dateRange) {
        filteredOrders = filteredOrders.filter(o => {
          const date = new Date(o.completed_at || o.scheduled_date);
          return date >= new Date(dateRange[0]) && date <= new Date(dateRange[1]);
        });
      }
      
      setWorkOrders(filteredOrders);
      
      // Calculate summary
      const totalCost = filteredOrders.reduce((sum, o) => sum + (o.actual_cost || o.estimated_cost || 0), 0);
      const laborHours = filteredOrders.reduce((sum, o) => sum + (o.labor_hours || 0), 0);
      const partsCost = filteredOrders.reduce((sum, o) => sum + (o.parts_cost || 0), 0);
      const preventiveCost = filteredOrders.filter(o => o.type === 'PREVENTIVE').reduce((sum, o) => sum + (o.actual_cost || o.estimated_cost || 0), 0);
      const correctiveCost = filteredOrders.filter(o => o.type === 'CORRECTIVE').reduce((sum, o) => sum + (o.actual_cost || o.estimated_cost || 0), 0);
      
      const machineMap = new Map<string, number>();
      filteredOrders.forEach(order => {
        const machine = order.machine_name || 'Unknown';
        machineMap.set(machine, (machineMap.get(machine) || 0) + (order.actual_cost || order.estimated_cost || 0));
      });
      
      setSummary({
        totalOrders: filteredOrders.length,
        totalCost,
        laborHours,
        partsCost,
        preventiveCost,
        correctiveCost,
        byMachine: Array.from(machineMap.entries()).map(([machine, cost]) => ({ machine, cost })),
      });
    } catch (error) {
      console.error('Error fetching costs data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
      render: (type: string) => (
        <Tag color={type === 'PREVENTIVE' ? 'blue' : type === 'CORRECTIVE' ? 'red' : 'purple'}>
          {type === 'PREVENTIVE' ? 'Préventif' : type === 'CORRECTIVE' ? 'Correctif' : 'Prédictif'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('fr-TN'),
    },
    {
      title: 'Heures main d\'œuvre',
      dataIndex: 'labor_hours',
      key: 'labor_hours',
      width: 140,
      align: 'right' as const,
      render: (hours: number) => hours ? `${hours} h` : '-',
    },
    {
      title: 'Coût pièces',
      dataIndex: 'parts_cost',
      key: 'parts_cost',
      width: 120,
      align: 'right' as const,
      render: (cost: number) => cost ? `${cost.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT` : '-',
    },
    {
      title: 'Coût total',
      dataIndex: 'actual_cost',
      key: 'actual_cost',
      width: 120,
      align: 'right' as const,
      render: (cost: number, record: WorkOrder) => {
        const total = cost || record.estimated_cost || 0;
        return <strong>{total.toLocaleString()} €</strong>;
      },
    },
  ];

  return (
    <Layout title="Rapport - Coûts de Maintenance" subtitle="Analyse des coûts par machine et période">
      <div className="maintenance-costs-report">
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
                    title="Coût total"
                    value={summary?.totalCost || 0}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="DT"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Coût préventif"
                    value={summary?.preventiveCost || 0}
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                    suffix="DT"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Coût correctif"
                    value={summary?.correctiveCost || 0}
                    precision={2}
                    valueStyle={{ color: '#ff4d4f' }}
                    suffix="DT"
                  />
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
              <Space wrap>
                <Text>Machine:</Text>
                <Select
                  style={{ width: 200 }}
                  placeholder="Toutes les machines"
                  allowClear
                  value={selectedMachine}
                  onChange={(value) => { setSelectedMachine(value); fetchData(); }}
                >
                  {machines.map(m => (
                    <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
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
                <Button onClick={() => { setSelectedMachine(null); setDateRange(null); fetchData(); }}>Effacer</Button>
              </Space>
            </Card>

            {/* Data Table */}
            <Card>
              {workOrders.length === 0 ? (
                <Empty description="Aucune donnée de coût disponible" />
              ) : (
                <Table
                  dataSource={workOrders}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} ordres` }}
                  scroll={{ x: 1000 }}
                  size="small"
                  summary={(pageData) => {
                    const totalCost = pageData.reduce((sum, record) => sum + (record.actual_cost || record.estimated_cost || 0), 0);
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={7}><strong>Total de la page</strong></Table.Summary.Cell>
                        <Table.Summary.Cell index={7} align="right"><strong>{totalCost.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</strong></Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              )}
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MaintenanceCostsReport;
