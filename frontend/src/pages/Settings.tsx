import React, { useState } from 'react';
import { Card, Row, Col, Typography, Space, Button, Menu, Tabs, Form, Input, Switch, Select, Divider, message, Avatar } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  BellOutlined, 
  GlobalOutlined, 
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  DatabaseOutlined,
  MailOutlined,
  SaveOutlined,
  KeyOutlined,
  TabletOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      message.success('Paramètres enregistrés avec succès');
    }, 1000);
  };

  const settingsMenu = [
    {
      key: 'general',
      icon: <SettingOutlined />,
      label: 'Général'
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mon Profil'
    },
    {
      key: 'security',
      icon: <SafetyOutlined />,
      label: 'Sécurité'
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications'
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'Gestion des Utilisateurs'
    },
    {
      key: 'company',
      icon: <DatabaseOutlined />,
      label: 'Entreprise'
    }
  ];

  return (
    <Layout title="Paramètres" subtitle="Gérez les paramètres de votre application et compte">
      <div className="settings-page">
        <Row gutter={24}>
        {/* Left Sidebar */}
        <Col xs={24} md={6}>
          <Card>
            <Menu
              mode="vertical"
              selectedKeys={[activeTab]}
              onClick={({ key }) => setActiveTab(key)}
              style={{ border: 'none' }}
              items={settingsMenu}
            />
          </Card>
        </Col>

        {/* Right Content */}
        <Col xs={24} md={18}>
          <Card>
            {activeTab === 'general' && (
              <div>
                <Title level={4}>Paramètres Généraux</Title>
                <Divider />
                
                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Langue">
                        <Select defaultValue="fr">
                          <Option value="fr">Français</Option>
                          <Option value="en">English</Option>
                          <Option value="es">Español</Option>
                          <Option value="de">Deutsch</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Fuseau Horaire">
                        <Select defaultValue="europe-paris">
                          <Option value="europe-paris">Europe/Paris (UTC+1)</Option>
                          <Option value="utc">UTC</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Devise">
                        <Select defaultValue="TND">
                          <Option value="TND">Dinar Tunisien (DT)</Option>
                          <Option value="EUR">Euro (€)</Option>
                          <Option value="USD">Dollar US ($)</Option>
                          <Option value="GBP">Livre Sterling (£)</Option>
                          <Option value="GBP">Livre Sterling (£)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Format de Date">
                        <Select defaultValue="DD/MM/YYYY">
                          <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                          <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                          <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Pagination par défaut">
                    <Select defaultValue="10">
                      <Option value="10">10 éléments</Option>
                      <Option value="25">25 éléments</Option>
                      <Option value="50">50 éléments</Option>
                      <Option value="100">100 éléments</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                      Enregistrer
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <Title level={4}>Mon Profil</Title>
                <Divider />

                <Row gutter={24}>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <Avatar size={120} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                    <br />
                    <Button>Changer la photo</Button>
                  </Col>
                  <Col span={16}>
                    <Form layout="vertical">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Prénom">
                            <Input defaultValue="Admin" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Nom">
                            <Input defaultValue="Utilisateur" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Email">
                        <Input type="email" defaultValue="admin@alutech.fr" />
                      </Form.Item>

                      <Form.Item label="Téléphone">
                        <Input defaultValue="+33 1 23 45 67 89" />
                      </Form.Item>

                      <Form.Item label="Fonction">
                        <Input defaultValue="Administrateur" />
                      </Form.Item>

                      <Form.Item>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                          Mettre à jour le profil
                        </Button>
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <Title level={4}>Sécurité</Title>
                <Divider />

                <Title level={5}>Changer le mot de passe</Title>
                <Form layout="vertical" style={{ maxWidth: 400 }}>
                  <Form.Item label="Mot de passe actuel" name="currentPassword">
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>
                  <Form.Item label="Nouveau mot de passe" name="newPassword">
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>
                  <Form.Item label="Confirmer le mot de passe" name="confirmPassword">
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary">Mettre à jour le mot de passe</Button>
                  </Form.Item>
                </Form>

                <Divider />

                <Title level={5}>Authentification à deux facteurs (2FA)</Title>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Space>
                    <TabletOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div>
                      <Text strong>Authentification par application</Text>
                      <br />
                      <Text type="secondary">Utilisez une application comme Google Authenticator</Text>
                    </div>
                    <Button onClick={() => navigate('/mfa-settings')}>
                      Configurer
                    </Button>
                  </Space>
                </Card>

                <Divider />

                <Title level={5}>Sessions actives</Title>
                <Card size="small">
                  <Space>
                    <KeyOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <div style={{ flex: 1 }}>
                      <Text strong>Session actuelle</Text>
                      <br />
                      <Text type="secondary">Chrome sur Windows - Paris, France</Text>
                    </div>
                    <Button danger>Déconnecter</Button>
                  </Space>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <Title level={4}>Notifications</Title>
                <Divider />

                <Title level={5}>Notifications par email</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div>
                      <Text strong>Nouvelles commandes</Text>
                      <br />
                      <Text type="secondary">Recevoir un email lors d'une nouvelle commande</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div>
                      <Text strong>Alertes stock</Text>
                      <br />
                      <Text type="secondary">Notifications quand le stock est bas</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div>
                      <Text strong>Non-conformités qualité</Text>
                      <br />
                      <Text type="secondary">Alertes pour les nouvelles NC</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div>
                      <Text strong>Maintenance préventive</Text>
                      <br />
                      <Text type="secondary">Rappels pour les interventions planifiées</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div>
                      <Text strong>Rapports automatiques</Text>
                      <br />
                      <Text type="secondary">Envoi automatique des rapports scheduled</Text>
                    </div>
                    <Switch />
                  </div>
                </Space>

                <Divider />

                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                    Enregistrer les préférences
                  </Button>
                </Form.Item>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <Title level={4}>Gestion des Utilisateurs</Title>
                <Divider />

                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<UserOutlined />}>
                    Ajouter un utilisateur
                  </Button>
                </Space>

                <Card size="small">
                  <Text>Liste des utilisateurs - Accédez à la gestion des utilisateurs pour voir et modifier les droits.</Text>
                  <div style={{ marginTop: 16 }}>
                    <Button onClick={() => navigate('/users')}>
                      Voir tous les utilisateurs
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'company' && (
              <div>
                <Title level={4}>Paramètres de l'Entreprise</Title>
                <Divider />

                <Form layout="vertical">
                  <Form.Item label="Nom de l'entreprise">
                    <Input defaultValue="AluTech ERP" />
                  </Form.Item>

                  <Form.Item label="Adresse">
                    <Input.TextArea rows={3} defaultValue="123 Rue de l'Aluminium\n75001 Paris, France" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Téléphone">
                        <Input defaultValue="+33 1 23 45 67 89" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Email">
                        <Input type="email" defaultValue="contact@alutech.fr" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="SIRET">
                        <Input defaultValue="123 456 789 00012" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="TVA Intracommunautaire">
                        <Input defaultValue="FR12 3456 7890 12" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                      Enregistrer
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            )}
          </Card>
        </Col>
      </Row>
      </div>
    </Layout>
  );
};

export default Settings;
