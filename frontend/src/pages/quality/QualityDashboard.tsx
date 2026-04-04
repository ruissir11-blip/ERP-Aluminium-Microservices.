import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, DatePicker, Select, Space, Spin, Alert, message } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  ExclamationCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { nonConformityApi, inspectionRecordApi, correctiveActionApi, qualityDecisionApi } from '../../services/quality/qualityApi';
import { NonConformity, InspectionRecord, CorrectiveAction, QualityDecision, QualityStatistics, NCSeverity, NCStatus, InspectionStatus, InspectionResult, CorrectiveActionStatus, DecisionStatus } from '../../types/quality.types';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import ParetoChart from '../../components/quality/ParetoChart';
import moment from 'moment';

const { RangePicker } = DatePicker;

const QualityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<QualityStatistics | null>(null);
  const [recentNCs, setRecentNCs] = useState<NonConformity[]>([]);
  const [openNCs, setOpenNCs] = useState<NonConformity[]>([]);
  const [upcomingActions, setUpcomingActions] = useState<CorrectiveAction[]>([]);
  const [pendingDecisions, setPendingDecisions] = useState<QualityDecision[]>([]);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all data in parallel
      const [statsRes, ncRes, priorityRes, actionsRes, decisionsRes] = await Promise.all([
        nonConformityApi.getStatistics(),
        nonConformityApi.getAll(),
        nonConformityApi.getPriority(),
        correctiveActionApi.getUpcoming(),
        qualityDecisionApi.getPending(),
      ]);

      setStatistics(statsRes);
      setRecentNCs(ncRes.slice(0, 10));
      setOpenNCs(priorityRes.slice(0, 5));
      setUpcomingActions(actionsRes.slice(0, 5));
      setPendingDecisions(decisionsRes.slice(0, 5));
    } catch (err: any) {
      console.error('Failed to load quality dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données du tableau de bord qualité');
      
      // Set mock data for demo purposes
      setStatistics({
        totalInspections: 156,
        passedInspections: 150,
        failedInspections: 6,
        pendingInspections: 12,
        passRate: 96.15,
        ncRate: 3.85,
        openNCs: 8,
        closedNCs: 45,
        ncBySeverity: {
          [NCSeverity.CRITIQUE]: 2,
          [NCSeverity.MAJEUR]: 4,
          [NCSeverity.MINEUR]: 2,
        },
        ncByStatus: {
          [NCStatus.OUVERTE]: 3,
          [NCStatus.EN_COURS]: 2,
          [NCStatus.TRAITEMENT]: 3,
          [NCStatus.CLOTUREE]: 45,
        },
      });
      
      setOpenNCs([
        {
          id: '1',
          nc_number: 'NC-2026-0001',
          description: 'Surface scratch detected on profile',
          severity: NCSeverity.MAJEUR,
          status: NCStatus.OUVERTE,
          detected_by: 'user-1',
          detected_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          nc_number: 'NC-2026-0002',
          description: 'Dimensional deviation exceeds tolerance',
          severity: NCSeverity.CRITIQUE,
          status: NCStatus.EN_COURS,
          detected_by: 'user-1',
          detected_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      
      setUpcomingActions([
        {
          id: '1',
          nc_id: '1',
          description: 'Replace worn tooling',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: CorrectiveActionStatus.A_FAIRE,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      
      setPendingDecisions([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: NCSeverity) => {
    switch (severity) {
      case NCSeverity.CRITIQUE:
        return 'red';
      case NCSeverity.MAJEUR:
        return 'orange';
      case NCSeverity.MINEUR:
        return 'blue';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: NCStatus) => {
    switch (status) {
      case NCStatus.OUVERTE:
        return 'red';
      case NCStatus.EN_COURS:
        return 'orange';
      case NCStatus.TRAITEMENT:
        return 'blue';
      case NCStatus.CLOTUREE:
        return 'green';
      default:
        return 'default';
    }
  };

  const getActionStatusColor = (status: CorrectiveActionStatus) => {
    switch (status) {
      case CorrectiveActionStatus.A_FAIRE:
        return 'red';
      case CorrectiveActionStatus.EN_COURS:
        return 'orange';
      case CorrectiveActionStatus.TERMINE:
        return 'blue';
      case CorrectiveActionStatus.VERIFIE:
        return 'green';
      default:
        return 'default';
    }
  };

  const ncColumns = [
    {
      title: 'N° NC',
      dataIndex: 'nc_number',
      key: 'nc_number',
      render: (text: string, record: NonConformity) => (
        <a onClick={() => navigate(`/quality/nc/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Sévérité',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: NCSeverity) => (
        <Tag color={getSeverityColor(severity)}>{severity.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: NCStatus) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Détecté le',
      dataIndex: 'detected_at',
      key: 'detected_at',
      render: (date: Date) => moment(date).format('DD/MM/YYYY'),
    },
  ];

  const actionColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: CorrectiveActionStatus) => (
        <Tag color={getActionStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Date limite',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: Date) => moment(date).format('DD/MM/YYYY'),
    },
  ];

  if (loading) {
    return (
      <Layout title="Dashboard Qualité" subtitle="Tableau de bord des indicateurs qualité">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Qualité" subtitle="Tableau de bord des indicateurs qualité">
      <div className="quality-dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadDashboardData}>
              Actualiser
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Erreur"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
          />
        )}

        {/* Key Metrics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Inspections"
                value={statistics?.totalInspections || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Taux de conformité"
                value={statistics?.passRate || 0}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="NC Ouvertes"
                value={statistics?.openNCs || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: statistics?.openNCs && statistics.openNCs > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Taux de NC"
                value={statistics?.ncRate || 0}
                suffix="%"
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: statistics?.ncRate && statistics.ncRate > 5 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* NC by Severity */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={8}>
            <Card title="NC par Sévérité">
              <Statistic
                title="Critique"
                value={statistics?.ncBySeverity?.[NCSeverity.CRITIQUE] || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
              <Statistic
                title="Majeur"
                value={statistics?.ncBySeverity?.[NCSeverity.MAJEUR] || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
              <Statistic
                title="Mineur"
                value={statistics?.ncBySeverity?.[NCSeverity.MINEUR] || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card 
              title="Analyse de Pareto" 
              extra={
                <Button 
                  type="link" 
                  icon={<BarChartOutlined />}
                  onClick={() => navigate('/quality/pareto')}
                >
                  Détails
                </Button>
              }
            >
              <ParetoChart height={200} />
            </Card>
          </Col>
        </Row>

        {/* Tables Row */}
        <Row gutter={[16, 16]}>
          {/* Open NCs */}
          <Col xs={24} lg={12}>
            <Card 
              title="NC Prioritaires" 
              extra={<Button type="link" onClick={() => navigate('/quality/nc')}>Voir tout</Button>}
            >
              <Table
                dataSource={openNCs}
                columns={ncColumns}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: 'Aucune NC ouverte' }}
              />
            </Card>
          </Col>

          {/* Upcoming Corrective Actions */}
          <Col xs={24} lg={12}>
            <Card 
              title="Actions Correctives à venir" 
              extra={<Button type="link" onClick={() => navigate('/quality/corrective-actions')}>Voir tout</Button>}
            >
              <Table
                dataSource={upcomingActions}
                columns={actionColumns}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: 'Aucune action corrective prévue' }}
              />
            </Card>
          </Col>

          {/* Pending Decisions */}
          <Col xs={24}>
            <Card 
              title="Décisions Qualité en attente" 
              extra={<Button type="link" onClick={() => navigate('/quality/decisions')}>Voir tout</Button>}
            >
              <Table
                dataSource={pendingDecisions}
                columns={[
                  {
                    title: 'N° NC',
                    key: 'nc',
                    render: (_: any, record: QualityDecision) => (
                      <a onClick={() => navigate(`/quality/nc/${record.nc_id}`)}>
                        {record.nonConformity?.nc_number || record.nc_id}
                      </a>
                    ),
                  },
                  {
                    title: 'Type de décision',
                    dataIndex: 'decision_type',
                    key: 'decision_type',
                  },
                  {
                    title: 'Statut',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: DecisionStatus) => (
                      <Tag color={status === DecisionStatus.EN_ATTENTE ? 'orange' : status === DecisionStatus.APPROUVE ? 'green' : 'red'}>
                        {status.toUpperCase()}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: any, record: QualityDecision) => (
                      <Space>
                        <Button type="link" onClick={() => navigate(`/quality/decisions/${record.id}`)}>
                          Réviser
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: 'Aucune décision en attente' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default QualityDashboard;
