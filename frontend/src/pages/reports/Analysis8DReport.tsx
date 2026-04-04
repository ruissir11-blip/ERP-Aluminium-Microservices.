import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Table, Tag, Select, Space, Button, Tabs, Collapse } from 'antd';
import { ArrowLeftOutlined, PieChartOutlined, FileTextOutlined, WarningOutlined, CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const { Title, Text } = Typography;

interface RootCause {
  id: string;
  nc_id: string;
  nc_number: string;
  nc_title: string;
  severity: string;
  status: string;
  cinq_pourquoi?: { responses: string[] };
  ishikawa?: { categories: Record<string, string[]> };
  created_at: string;
}

interface Summary {
  totalRootCauses: number;
  with5Why: number;
  withIshikawa: number;
  completed: number;
}

const Analysis8DReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedRC, setSelectedRC] = useState<RootCause | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: RootCause[] }>('/quality/root-causes', { 
        params: { perPage: '200' } 
      });
      const items = response.data.data || [];
      setRootCauses(items);
      
      setSummary({
        totalRootCauses: items.length,
        with5Why: items.filter(rc => rc.cinq_pourquoi && rc.cinq_pourquoi.responses?.length > 0).length,
        withIshikawa: items.filter(rc => rc.ishikawa && Object.keys(rc.ishikawa.categories || {}).length > 0).length,
        completed: items.filter(rc => rc.status === 'COMPLETED').length,
      });
    } catch (error) {
      console.error('Error fetching root cause data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'N° NC',
      dataIndex: 'nc_number',
      key: 'nc_number',
      width: 100,
    },
    {
      title: 'Titre NC',
      dataIndex: 'nc_title',
      key: 'nc_title',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Sévérité',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const color = severity === 'CRITICAL' ? 'red' : severity === 'HIGH' ? 'orange' : severity === 'MEDIUM' ? 'blue' : 'default';
        return <Tag color={color}>{severity}</Tag>;
      },
    },
    {
      title: 'Méthode 5 Pourquoi',
      key: 'cinq_pourquoi',
      width: 120,
      render: (_: unknown, record: RootCause) => (
        record.cinq_pourquoi && record.cinq_pourquoi.responses?.length > 0 
          ? <Tag color="green"><CheckCircleOutlined /> Complété</Tag>
          : <Tag><QuestionCircleOutlined /> Non fatto</Tag>
      ),
    },
    {
      title: 'Diagramme Ishikawa',
      key: 'ishikawa',
      width: 140,
      render: (_: unknown, record: RootCause) => (
        record.ishikawa && Object.keys(record.ishikawa.categories || {}).length > 0
          ? <Tag color="green"><CheckCircleOutlined /> Complété</Tag>
          : <Tag><QuestionCircleOutlined /> Non fatto</Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (status === 'COMPLETED') return <Tag color="green">Terminé</Tag>;
        if (status === 'IN_PROGRESS') return <Tag color="processing">En cours</Tag>;
        return <Tag>En attente</Tag>;
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
                  title="Total analyses 8D"
                  value={summary?.totalRootCauses || 0}
                  prefix={<PieChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="5 Pourquoi complétés"
                  value={summary?.with5Why || 0}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Ishikawa complétés"
                  value={summary?.withIshikawa || 0}
                  prefix={<PieChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Analyses terminées"
                  value={summary?.completed || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Analyses de causes racines">
            {rootCauses.length === 0 ? (
              <Empty description="Aucune analyse 8D disponible" />
            ) : (
              <Table
                dataSource={rootCauses}
                columns={columns}
                rowKey="id"
                rowSelection={{
                  selectedRowKeys: selectedRC ? [selectedRC.id] : [],
                  onChange: (_selectedRowKeys, selectedRows) => {
                    if (selectedRows.length > 0) {
                      setSelectedRC(selectedRows[0] as RootCause);
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
      label: 'Détails de l\'analyse',
      children: selectedRC ? (
        <Card title={`Analyse 8D - NC #${selectedRC.nc_number}`}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={5}>Non-conformité</Title>
              <Text>{selectedRC.nc_title}</Text>
            </Col>
          </Row>
          
          <Collapse style={{ marginTop: 16 }} defaultActiveKey={['5pourquoi']}>
            <Collapse.Panel header="Méthode des 5 Pourquoi" key="5pourquoi">
              {selectedRC.cinq_pourquoi && selectedRC.cinq_pourquoi.responses?.length > 0 ? (
                <ol>
                  {selectedRC.cinq_pourquoi.responses.map((response, idx) => (
                    <li key={idx} style={{ marginBottom: 8 }}>
                      <Text>{response}</Text>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty description="Analyse 5 Pourquoi non effectuée" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Collapse.Panel>
            
            <Collapse.Panel header="Diagramme d'Ishikawa (Arête de poisson)" key="ishikawa">
              {selectedRC.ishikawa && Object.keys(selectedRC.ishikawa.categories || {}).length > 0 ? (
                <div>
                  {Object.entries(selectedRC.ishikawa.categories).map(([category, causes]) => (
                    <div key={category} style={{ marginBottom: 16 }}>
                      <Text strong>{category}</Text>
                      <ul>
                        {causes.map((cause, idx) => (
                          <li key={idx}>
                            <Text>{cause}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="Diagramme Ishikawa non effectué" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Collapse.Panel>
          </Collapse>
          
          <Button 
            type="primary" 
            style={{ marginTop: 16 }}
            onClick={() => setSelectedRC(null)}
          >
            Fermer
          </Button>
        </Card>
      ) : (
        <Empty description="Sélectionnez une analyse pour voir les détails" />
      ),
    },
  ];

  return (
    <Layout title="Rapport - Analyse 8D" subtitle="Rapports d'analyse des causes racines">
      <div className="analysis-8d-report">
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

export default Analysis8DReport;
