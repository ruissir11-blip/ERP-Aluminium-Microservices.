import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Space } from 'antd';
import { 
  FileTextOutlined, 
  BarChartOutlined, 
  PieChartOutlined, 
  LineChartOutlined,
  TableOutlined,
  DownloadOutlined,
  DashboardOutlined,
  StockOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  TruckOutlined
} from '@ant-design/icons';
import Layout from '../components/common/Layout';

const { Title, Text } = Typography;

const Reports: React.FC = () => {
  const navigate = useNavigate();

  const reportCategories = [
    {
      title: 'Production & Stock',
      color: '#1890ff',
      reports: [
        { 
          title: 'État du Stock', 
          description: 'Rapport sur les niveaux de stock par entrepôt',
          icon: <StockOutlined style={{ fontSize: 24 }} />,
          path: '/reports/stock-levels'
        },
        { 
          title: 'Mouvements de Stock', 
          description: 'Historique des entrées et sorties',
          icon: <TableOutlined style={{ fontSize: 24 }} />,
          path: '/reports/stock-movements'
        },
        { 
          title: 'Inventaire', 
          description: 'Résultats des comptages d\'inventaire',
          icon: <CheckCircleOutlined style={{ fontSize: 24 }} />,
          path: '/reports/inventory-results'
        },
        { 
          title: 'Alertes Stock', 
          description: 'Rapport des alertes de stock bas',
          icon: <BarChartOutlined style={{ fontSize: 24 }} />,
          path: '/reports/stock-alerts'
        }
      ]
    },
    {
      title: 'Maintenance',
      color: '#52c41a',
      reports: [
        { 
          title: 'Tableau de Bord Maintenance', 
          description: 'Vue d\'ensemble des indicateurs maintenance',
          icon: <DashboardOutlined style={{ fontSize: 24 }} />,
          path: '/reports/maintenance-dashboard'
        },
        { 
          title: 'Coûts de Maintenance', 
          description: 'Analyse des coûts par machine et période',
          icon: <DollarOutlined style={{ fontSize: 24 }} />,
          path: '/reports/maintenance-costs'
        },
        { 
          title: 'Métriques de Maintenance', 
          description: 'TRS, MTBF, MTTR et autres indicateurs',
          icon: <LineChartOutlined style={{ fontSize: 24 }} />,
          path: '/reports/maintenance-metrics'
        },
        { 
          title: 'Ordres de Travail', 
          description: 'Liste et statut des ordres de travail',
          icon: <ToolOutlined style={{ fontSize: 24 }} />,
          path: '/reports/work-orders'
        }
      ]
    },
    {
      title: 'Qualité',
      color: '#722ed1',
      reports: [
        { 
          title: 'Dashboard Qualité', 
          description: 'Indicateurs qualité et statistiques',
          icon: <BarChartOutlined style={{ fontSize: 24 }} />,
          path: '/reports/quality-dashboard'
        },
        { 
          title: 'Non-conformités', 
          description: 'Liste des NC avec filtres par sévérité',
          icon: <FileTextOutlined style={{ fontSize: 24 }} />,
          path: '/reports/non-conformities'
        },
        { 
          title: 'Analyse 8D', 
          description: 'Rapports d\'analyse des causes racines',
          icon: <PieChartOutlined style={{ fontSize: 24 }} />,
          path: '/reports/8d-analysis'
        },
        { 
          title: 'Actions Correctives', 
          description: 'Suivi des actions préventives et correctives',
          icon: <CheckCircleOutlined style={{ fontSize: 24 }} />,
          path: '/reports/corrective-actions'
        }
      ]
    },
    {
      title: 'Commercial & Finance',
      color: '#fa8c16',
      reports: [
        { 
          title: 'Devis', 
          description: 'Liste des devis et taux de conversion',
          icon: <FileTextOutlined style={{ fontSize: 24 }} />,
          path: '/quotes'
        },
        { 
          title: 'Commandes', 
          description: 'Suivi des commandes clients',
          icon: <TruckOutlined style={{ fontSize: 24 }} />,
          path: '/orders'
        },
        { 
          title: 'Performance Commerciale', 
          description: 'Indicateurs de performance des commerciaux',
          icon: <LineChartOutlined style={{ fontSize: 24 }} />,
          path: '/comptabilite/financial-dashboard'
        }
      ]
    },
    {
      title: 'Comptabilité',
      color: '#eb2f96',
      reports: [
        { 
          title: 'Dashboard Financier', 
          description: 'Vue d\'ensemble des indicateurs financiers',
          icon: <DashboardOutlined style={{ fontSize: 24 }} />,
          path: '/comptabilite/financial'
        },
        { 
          title: 'Coûts de Production', 
          description: 'Analyse des coûts par produit',
          icon: <DollarOutlined style={{ fontSize: 24 }} />,
          path: '/comptabilite/product-costs'
        },
        { 
          title: 'ROI Équipements', 
          description: 'Calcul du retour sur investissement',
          icon: <BarChartOutlined style={{ fontSize: 24 }} />,
          path: '/comptabilite/roi'
        },
        { 
          title: 'KPI Financiers', 
          description: 'Indicateurs clés de performance',
          icon: <LineChartOutlined style={{ fontSize: 24 }} />,
          path: '/comptabilite/kpi'
        },
        {
          title: 'Calcul des Paies',
          description: 'Calcul et génération des paies mensuelles',
          icon: <DollarOutlined style={{ fontSize: 24 }} />,
          path: '/comptabilite/payroll-calculation'
        }
      ]
    },
    {
      title: 'BI & Analytics',
      color: '#13c2c2',
      reports: [
        { 
          title: 'Dashboards BI', 
          description: 'Tableaux de bord analytiques avancés',
          icon: <DashboardOutlined style={{ fontSize: 24 }} />,
          path: '/bi-dashboards'
        },
        { 
          title: 'Prévisions IA', 
          description: 'Prédictions et analyses IA',
          icon: <LineChartOutlined style={{ fontSize: 24 }} />,
          path: '/ai/forecasting'
        },
        { 
          title: 'Optimisation Stock', 
          description: 'Recommandations IA pour les stocks',
          icon: <StockOutlined style={{ fontSize: 24 }} />,
          path: '/ai/inventory'
        },
        { 
          title: 'Planification Production', 
          description: 'Calendrier de production optimisé',
          icon: <BarChartOutlined style={{ fontSize: 24 }} />,
          path: '/ai/production'
        }
      ]
    }
  ];

  return (
    <Layout title="Rapports" subtitle="Accédez à tous les rapports et tableaux de bord">
      <div className="reports-page">
        {reportCategories.map((category, catIndex) => (
        <div key={catIndex} style={{ marginBottom: 32 }}>
          <div style={{ 
            marginBottom: 16, 
            paddingBottom: 8, 
            borderBottom: `2px solid ${category.color}` 
          }}>
            <Title level={4} style={{ marginBottom: 0, color: category.color }}>
              {category.title}
            </Title>
          </div>
          
          <Row gutter={[16, 16]}>
            {category.reports.map((report, reportIndex) => (
              <Col xs={24} sm={12} lg={6} key={reportIndex}>
                <Card
                  hoverable
                  onClick={() => navigate(report.path)}
                  size="small"
                  style={{ borderRadius: 8 }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: category.color }}>
                      {report.icon}
                    </div>
                    <Title level={5} style={{ marginBottom: 0 }}>
                      {report.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {report.description}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      <Card style={{ marginTop: 24, background: '#f5f5f5' }}>
        <Space direction="vertical" style={{ width: '100%' }} align="center">
          <DownloadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <Title level={4} style={{ marginBottom: 0 }}>
            Export de Données
          </Title>
          <Text type="secondary">
            Besoin d'un rapport personnalisé? Exportez vos données en Excel, PDF ou CSV.
          </Text>
        </Space>
      </Card>
      </div>
    </Layout>
  );
};

export default Reports;
