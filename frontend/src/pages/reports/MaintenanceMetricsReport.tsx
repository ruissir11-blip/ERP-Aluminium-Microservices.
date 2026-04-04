import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, Select, Space, Button, Progress, Tabs } from 'antd';
import { ArrowLeftOutlined, LineChartOutlined, DashboardOutlined, ClockCircleOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;

interface Machine {
  id: string;
  name: string;
  reference: string;
  status: string;
}

interface MachineMetrics {
  machine_id: string;
  machine_name: string;
  trs?: number;
  mtbf?: number;
  mttr?: number;
  availability?: number;
  performance?: number;
  quality_metric?: number;
  total_operational_hours: number;
  total_downtime_hours: number;
  total_production: number;
  total_defects: number;
  failure_count: number;
  maintenance_count: number;
}

interface MetricsSummary {
  averageTRS: number;
  averageMTBF: number;
  averageMTTR: number;
  averageAvailability: number;
  totalFailures: number;
  totalMaintenances: number;
}

const MaintenanceMetricsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [metrics, setMetrics] = useState<MachineMetrics[]>([]);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [machineMetrics, setMachineMetrics] = useState<MachineMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const machinesResponse = await api.get<{ data: Machine[] }>('/maintenance/machines/active');
      const machinesData = machinesResponse.data.data || [];
      setMachines(machinesData);
      
      // Fetch all machine metrics
      try {
        const metricsResponse = await api.get<{ data: MachineMetrics[] }>('/maintenance/metrics/all');
        const metricsData = metricsResponse.data.data || [];
        
        // Filter by machine if selected
        const filteredMetrics = selectedMachine 
          ? metricsData.filter(m => m.machine_id === selectedMachine)
          : metricsData;
        
        setMetrics(filteredMetrics);
        
        if (selectedMachine) {
          const selected = filteredMetrics[0];
          if (selected) {
            setMachineMetrics(selected);
          }
        } else {
          // Calculate averages
          const validMetrics = filteredMetrics.filter(m => m.trs !== undefined);
          setSummary({
            averageTRS: validMetrics.reduce((sum, m) => sum + (m.trs || 0), 0) / validMetrics.length || 0,
            averageMTBF: validMetrics.reduce((sum, m) => sum + (m.mtbf || 0), 0) / validMetrics.length || 0,
            averageMTTR: validMetrics.reduce((sum, m) => sum + (m.mttr || 0), 0) / validMetrics.length || 0,
            averageAvailability: validMetrics.reduce((sum, m) => sum + (m.availability || 0), 0) / validMetrics.length || 0,
            totalFailures: validMetrics.reduce((sum, m) => sum + (m.failure_count || 0), 0),
            totalMaintenances: validMetrics.reduce((sum, m) => sum + (m.maintenance_count || 0), 0),
          });
        }
      } catch (metricsError) {
        console.error('Error fetching metrics:', metricsError);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (trs: number) => {
    if (trs >= 85) return '#52c41a';
    if (trs >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine_name',
      key: 'machine_name',
      width: 180,
      fixed: 'left' as const,
    },
    {
      title: 'TRS (%)',
      dataIndex: 'trs',
      key: 'trs',
      width: 120,
      align: 'center' as const,
      sorter: (a: MachineMetrics, b: MachineMetrics) => (a.trs || 0) - (b.trs || 0),
      render: (trs: number, record: MachineMetrics) => (
        <Progress 
          percent={trs || 0} 
          size="small"
          status={trs && trs >= 85 ? 'success' : trs && trs >= 70 ? 'normal' : 'exception'}
          format={(percent) => `${percent?.toFixed(1)}%`}
          strokeColor={getStatusColor(trs || 0)}
        />
      ),
    },
    {
      title: 'Disponibilité (%)',
      dataIndex: 'availability',
      key: 'availability',
      width: 130,
      align: 'center' as const,
      render: (val: number) => val ? `${val.toFixed(1)}%` : '-',
    },
    {
      title: 'Performance (%)',
      dataIndex: 'performance',
      key: 'performance',
      width: 130,
      align: 'center' as const,
      render: (val: number) => val ? `${val.toFixed(1)}%` : '-',
    },
    {
      title: 'Qualité (%)',
      dataIndex: 'quality_metric',
      key: 'quality_metric',
      width: 120,
      align: 'center' as const,
      render: (val: number) => val ? `${val.toFixed(1)}%` : '-',
    },
    {
      title: 'MTBF (h)',
      dataIndex: 'mtbf',
      key: 'mtbf',
      width: 100,
      align: 'right' as const,
      render: (val: number) => val ? val.toFixed(1) : '-',
    },
    {
      title: 'MTTR (h)',
      dataIndex: 'mttr',
      key: 'mttr',
      width: 100,
      align: 'right' as const,
      render: (val: number) => val ? val.toFixed(1) : '-',
    },
    {
      title: 'Pannes',
      dataIndex: 'failure_count',
      key: 'failure_count',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Maintenances',
      dataIndex: 'maintenance_count',
      key: 'maintenance_count',
      width: 110,
      align: 'center' as const,
    },
    {
      title: 'Heures opérationnelles',
      dataIndex: 'total_operational_hours',
      key: 'total_operational_hours',
      width: 140,
      align: 'right' as const,
      render: (val: number) => val ? val.toLocaleString() : '-',
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
                  title="TRS moyen"
                  value={summary?.averageTRS || machineMetrics?.trs || 0}
                  precision={1}
                  suffix="%"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: getStatusColor(summary?.averageTRS || machineMetrics?.trs || 0) }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Disponibilité moyenne"
                  value={summary?.averageAvailability || machineMetrics?.availability || 0}
                  precision={1}
                  suffix="%"
                  prefix={<DashboardOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="MTBF moyen"
                  value={summary?.averageMTBF || machineMetrics?.mtbf || 0}
                  precision={1}
                  suffix="h"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="MTTR moyen"
                  value={summary?.averageMTTR || machineMetrics?.mttr || 0}
                  precision={1}
                  suffix="h"
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Métriques par machine">
            {metrics.length === 0 ? (
              <Empty description="Aucune métrique disponible" />
            ) : (
              <Table
                dataSource={metrics}
                columns={columns}
                rowKey="machine_id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1100 }}
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
      children: selectedMachine ? (
        machineMetrics ? (
          <Card title={`Métriques - ${machineMetrics.machine_name}`}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" title="TRS (Taux de Rendement Synthétique)">
                  <Progress 
                    type="dashboard" 
                    percent={machineMetrics.trs || 0} 
                    format={(percent) => `${percent?.toFixed(1)}%`}
                    strokeColor={getStatusColor(machineMetrics.trs || 0)}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="Disponibilité">
                  <Progress 
                    type="dashboard" 
                    percent={machineMetrics.availability || 0} 
                    format={(percent) => `${percent?.toFixed(1)}%`}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="Performance">
                  <Progress 
                    type="dashboard" 
                    percent={machineMetrics.performance || 0} 
                    format={(percent) => `${percent?.toFixed(1)}%`}
                  />
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} md={8}>
                <Card size="small" title="MTBF (Mean Time Between Failures)">
                  <Statistic 
                    value={machineMetrics.mtbf || 0} 
                    suffix=" heures" 
                    valueStyle={{ fontSize: 24 }}
                  />
                  <Text type="secondary">Temps moyen entre les pannes</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="MTTR (Mean Time To Repair)">
                  <Statistic 
                    value={machineMetrics.mttr || 0} 
                    suffix=" heures" 
                    valueStyle={{ fontSize: 24 }}
                  />
                  <Text type="secondary">Temps moyen de réparation</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="Qualité">
                  <Progress 
                    percent={machineMetrics.quality_metric || 0} 
                    format={(percent) => `${percent?.toFixed(1)}%`}
                    status="success"
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        ) : (
          <Empty description="Sélectionnez une machine" />
        )
      ) : (
        <Empty description="Sélectionnez une machine pour voir les détails" />
      ),
    },
  ];

  return (
    <Layout title="Rapport - Métriques de Maintenance" subtitle="TRS, MTBF, MTTR et autres indicateurs">
      <div className="maintenance-metrics-report">
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
            {/* Machine Filter */}
            <Card style={{ marginBottom: 16 }}>
              <Space>
                <Text>Sélectionner une machine:</Text>
                <Select
                  style={{ width: 250 }}
                  placeholder="Toutes les machines (vue d'ensemble)"
                  allowClear
                  value={selectedMachine}
                  onChange={(value) => { 
                    setSelectedMachine(value); 
                    fetchData(); 
                    if (value) setActiveTab('details');
                  }}
                >
                  {machines.map(m => (
                    <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
                  ))}
                </Select>
              </Space>
            </Card>

            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
          </>
        )}
      </div>
    </Layout>
  );
};

export default MaintenanceMetricsReport;
