import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, Button } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;

interface InspectionRecord {
  id: string;
  record_number: string;
  inspection_point_name: string;
  profile_name: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  inspector_name?: string;
  inspected_at: string;
}

interface NonConformity {
  id: string;
  nc_number: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATION' | 'CLOSED';
  created_at: string;
}

interface QualityStats {
  totalInspections: number;
  passRate: number;
  totalNC: number;
  openNC: number;
  criticalNC: number;
}

const QualityDashboardReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [stats, setStats] = useState<QualityStats | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inspections
      const inspectionsResponse = await api.get<{ data: InspectionRecord[] }>('/quality/inspection-records', { 
        params: { perPage: '100' } 
      });
      const inspectionsData = inspectionsResponse.data.data || [];
      setInspections(inspectionsData);
      
      // Fetch non-conformities
      const ncResponse = await api.get<{ data: NonConformity[] }>('/quality/non-conformities', { 
        params: { perPage: '100' } 
      });
      const ncData = ncResponse.data.data || [];
      setNonConformities(ncData);
      
      // Calculate stats
      const passed = inspectionsData.filter(i => i.result === 'PASS').length;
      const passRate = inspectionsData.length > 0 ? (passed / inspectionsData.length) * 100 : 0;
      
      setStats({
        totalInspections: inspectionsData.length,
        passRate,
        totalNC: ncData.length,
        openNC: ncData.filter(nc => nc.status !== 'CLOSED').length,
        criticalNC: ncData.filter(nc => nc.severity === 'CRITICAL').length,
      });
    } catch (error) {
      console.error('Error fetching quality data:', error);
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

  const inspectionColumns = [
    {
      title: 'N°',
      dataIndex: 'record_number',
      key: 'record_number',
      width: 120,
    },
    {
      title: 'Point de contrôle',
      dataIndex: 'inspection_point_name',
      key: 'inspection_point_name',
      width: 180,
    },
    {
      title: 'Profil',
      dataIndex: 'profile_name',
      key: 'profile_name',
      width: 150,
    },
    {
      title: 'Résultat',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result: string) => {
        if (result === 'PASS') return <Tag color="green" icon={<CheckCircleOutlined />}>Conforme</Tag>;
        if (result === 'FAIL') return <Tag color="red" icon={<CloseCircleOutlined />}>Non conforme</Tag>;
        return <Tag color="default">En attente</Tag>;
      },
    },
    {
      title: 'Inspecteur',
      dataIndex: 'inspector_name',
      key: 'inspector_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: 'Date',
      dataIndex: 'inspected_at',
      key: 'inspected_at',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
  ];

  const ncColumns = [
    {
      title: 'N° NC',
      dataIndex: 'nc_number',
      key: 'nc_number',
      width: 100,
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Sévérité',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const info = getSeverityInfo(severity);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        if (status === 'OPEN') return <Tag color="red">Ouvert</Tag>;
        if (status === 'INVESTIGATION') return <Tag color="orange">En investigation</Tag>;
        return <Tag color="green">Fermé</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <Layout title="Rapport - Dashboard Qualité" subtitle="Indicateurs qualité et statistiques">
      <div className="quality-dashboard-report">
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
                    title="Total inspections"
                    value={stats?.totalInspections || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Taux de conformité"
                    value={stats?.passRate || 0}
                    precision={1}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: (stats?.passRate || 0) >= 95 ? '#52c41a' : (stats?.passRate || 0) >= 80 ? '#faad14' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total NC"
                    value={stats?.totalNC || 0}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="NC ouvertes"
                    value={stats?.openNC || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Recent Inspections */}
            <Card title="Inspections récentes" style={{ marginBottom: 16 }}>
              {inspections.length === 0 ? (
                <Empty description="Aucune inspection disponible" />
              ) : (
                <Table
                  dataSource={inspections.slice(0, 10)}
                  columns={inspectionColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>

            {/* Non-Conformities */}
            <Card title="Non-conformités">
              {nonConformities.length === 0 ? (
                <Empty description="Aucune non-conformité disponible" />
              ) : (
                <Table
                  dataSource={nonConformities.slice(0, 10)}
                  columns={ncColumns}
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

export default QualityDashboardReport;
