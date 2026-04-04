import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Space, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  SafetyOutlined,
  FileTextOutlined,
  AlertOutlined,
  ToolOutlined,
  BarChartOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import Layout from '../../components/common/Layout';

const { Title, Text } = Typography;

const QualityIndex: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Dashboard Qualité',
      description: 'Vue d\'ensemble des indicateurs qualité',
      icon: <BarChartOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      path: '/quality/dashboard',
      color: '#e6f7ff'
    },
    {
      title: 'Non-conformités',
      description: 'Gestion des NC et suivi des problèmes',
      icon: <WarningOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      path: '/quality/nc',
      color: '#fffbe6'
    },
    {
      title: 'Points d\'inspection',
      description: 'Configuration des points de contrôle',
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      path: '/quality/inspection-points',
      color: '#f6ffed'
    },
    {
      title: 'Enregistrements d\'inspection',
      description: 'Suivi des inspections réalisées',
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      path: '/quality/inspection-records',
      color: '#f9f0ff'
    },
    {
      title: 'Décisions Qualité',
      description: 'Traitement des décisions qualité',
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
      path: '/quality/decisions',
      color: '#e6fffb'
    },
    {
      title: 'Actions Correctives',
      description: 'Suivi des actions correctives',
      icon: <ToolOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      path: '/quality/corrective-actions',
      color: '#fff0f6'
    },
    {
      title: 'Analyse des Causes',
      description: 'Analyse des causes racines (5M, 8D)',
      icon: <AlertOutlined style={{ fontSize: 32, color: '#fa541c' }} />,
      path: '/quality/root-cause',
      color: '#fff7e6'
    }
  ];

  return (
    <Layout title="Qualité" subtitle="Module de gestion de la qualité">
      <div className="quality-index">
        <Row gutter={[16, 16]}>
          {menuItems.map((item, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              onClick={() => navigate(item.path)}
              style={{ 
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 8, 
                  background: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }}>
                  {item.icon}
                </div>
                <Title level={5} style={{ marginBottom: 4 }}>{item.title}</Title>
                <Text type="secondary">{item.description}</Text>
                <div style={{ marginTop: 8 }}>
                  <Button type="link" style={{ padding: 0 }}>
                    Accéder <ArrowRightOutlined />
                  </Button>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Taux de conformité" 
              value={96.5} 
              suffix="%" 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="NC en cours" 
              value={12} 
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Actions en retard" 
              value={3} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
      </div>
    </Layout>
  );
};

export default QualityIndex;
