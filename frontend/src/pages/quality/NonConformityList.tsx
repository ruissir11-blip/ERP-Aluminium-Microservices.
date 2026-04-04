import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Tag, Space, Modal, Form, Input, Select, Row, Col, Drawer, Descriptions, Spin, Alert, message, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  CloseCircleOutlined, 
  ReloadOutlined,
} from '@ant-design/icons';
import { nonConformityApi } from '../../services/quality/qualityApi';
import { NonConformity, NonConformityCreate, NonConformityUpdate, NCSeverity, NCStatus } from '../../types/quality.types';
import Layout from '../../components/common/Layout';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;

const NonConformityList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ncList, setNcList] = useState<NonConformity[]>([]);
  const [selectedNC, setSelectedNC] = useState<NonConformity | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNC, setEditingNC] = useState<NonConformity | null>(null);
  const [filters, setFilters] = useState<{ status?: NCStatus; severity?: NCSeverity }>({});
  
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();

  useEffect(() => {
    loadNCs();
  }, [filters]);

  const loadNCs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nonConformityApi.getAll(filters);
      setNcList(data);
    } catch (err: any) {
      console.error('Failed to load non-conformities:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des non-conformités');
      // Mock data for demo
      setNcList([
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
        {
          id: '3',
          nc_number: 'NC-2026-0003',
          description: 'Color variation outside tolerance',
          severity: NCSeverity.MINEUR,
          status: NCStatus.TRAITEMENT,
          detected_by: 'user-2',
          detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updated_at: new Date(),
        },
        {
          id: '4',
          nc_number: 'NC-2026-0004',
          description: 'Welding defect on assembly',
          severity: NCSeverity.MAJEUR,
          status: NCStatus.CLOTUREE,
          detected_by: 'user-1',
          detected_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          closed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          resolution_notes: 'Tool replaced, additional training provided',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await nonConformityApi.create(values as NonConformityCreate);
      message.success('Non-conformité créée avec succès');
      setModalVisible(false);
      form.resetFields();
      loadNCs();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la création de la non-conformité');
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingNC) return;
    try {
      await nonConformityApi.update(editingNC.id, values as NonConformityUpdate);
      message.success('Non-conformité mise à jour avec succès');
      setEditingNC(null);
      updateForm.resetFields();
      loadNCs();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour de la non-conformité');
    }
  };

  const handleClose = async (id: string, resolutionNotes?: string) => {
    try {
      await nonConformityApi.close(id, resolutionNotes);
      message.success('Non-conformité clôturée avec succès');
      loadNCs();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la clôture de la non-conformité');
    }
  };

  const getSeverityColor = (severity: NCSeverity) => {
    switch (severity) {
      case NCSeverity.CRITIQUE: return 'red';
      case NCSeverity.MAJEUR: return 'orange';
      case NCSeverity.MINEUR: return 'blue';
      default: return 'default';
    }
  };

  const getStatusColor = (status: NCStatus) => {
    switch (status) {
      case NCStatus.OUVERTE: return 'red';
      case NCStatus.EN_COURS: return 'orange';
      case NCStatus.TRAITEMENT: return 'blue';
      case NCStatus.CLOTUREE: return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'N° NC',
      dataIndex: 'nc_number',
      key: 'nc_number',
      render: (text: string, record: NonConformity) => (
        <a onClick={() => {
          setSelectedNC(record);
          setDrawerVisible(true);
        }}>{text}</a>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      title: 'N° Lot',
      dataIndex: 'lot_number',
      key: 'lot_number',
    },
    {
      title: 'Détecté le',
      dataIndex: 'detected_at',
      key: 'detected_at',
      render: (date: Date) => moment(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: NonConformity) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedNC(record);
              setDrawerVisible(true);
            }}
          >
            Voir
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingNC(record);
              updateForm.setFieldsValue(record);
            }}
          >
            Modifier
          </Button>
          {record.status !== NCStatus.CLOTUREE && (
            <Popconfirm
              title="Clôturer cette non-conformité ?"
              onConfirm={() => handleClose(record.id)}
            >
              <Button type="link" icon={<CloseCircleOutlined />} danger>
                Clôturer
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout title="Non-conformités" subtitle="Gestion des NC et suivi des problèmes qualité">
      <div className="non-conformity-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadNCs}>Actualiser</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Nouvelle NC
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Select
                placeholder="Filtrer par statut"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value={NCStatus.OUVERTE}>Ouverte</Option>
                <Option value={NCStatus.EN_COURS}>En Cours</Option>
                <Option value={NCStatus.TRAITEMENT}>Traitement</Option>
                <Option value={NCStatus.CLOTUREE}>Cloturée</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filtrer par sévérité"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <Option value={NCSeverity.CRITIQUE}>Critique</Option>
                <Option value={NCSeverity.MAJEUR}>Majeur</Option>
                <Option value={NCSeverity.MINEUR}>Mineur</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {error && (
          <Alert message="Erreur" description={error} type="error" showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Card>
          <Table
            dataSource={ncList}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Aucune non-conformité trouvée' }}
          />
        </Card>

        {/* Create Modal */}
        <Modal
          title="Créer une Non-Conformité"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Veuillez entrer une description' }]}
            >
              <TextArea rows={4} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="severity"
                  label="Sévérité"
                  rules={[{ required: true, message: 'Veuillez sélectionner la sévérité' }]}
                >
                  <Select>
                    <Option value={NCSeverity.CRITIQUE}>Critique</Option>
                    <Option value={NCSeverity.MAJEUR}>Majeur</Option>
                    <Option value={NCSeverity.MINEUR}>Mineur</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lot_number" label="N° Lot">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="production_order_id" label="N° Ordre de Production">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Créer la Non-Conformité
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Update Modal */}
        <Modal
          title="Modifier la Non-Conformité"
          open={!!editingNC}
          onCancel={() => {
            setEditingNC(null);
            updateForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={updateForm} layout="vertical" onFinish={handleUpdate}>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Veuillez entrer une description' }]}
            >
              <TextArea rows={4} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="severity" label="Sévérité">
                  <Select>
                    <Option value={NCSeverity.CRITIQUE}>Critique</Option>
                    <Option value={NCSeverity.MAJEUR}>Majeur</Option>
                    <Option value={NCSeverity.MINEUR}>Mineur</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Statut">
                  <Select>
                    <Option value={NCStatus.OUVERTE}>Ouverte</Option>
                    <Option value={NCStatus.EN_COURS}>En Cours</Option>
                    <Option value={NCStatus.TRAITEMENT}>Traitement</Option>
                    <Option value={NCStatus.CLOTUREE}>Cloturée</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="resolution_notes" label="Notes de résolution">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Mettre à jour la Non-Conformité
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Details Drawer */}
        <Drawer
          title={`NC ${selectedNC?.nc_number}`}
          placement="right"
          width={600}
          open={drawerVisible}
          onClose={() => {
            setDrawerVisible(false);
            setSelectedNC(null);
          }}
        >
          {selectedNC && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="N° NC">{selectedNC.nc_number}</Descriptions.Item>
              <Descriptions.Item label="Sévérité">
                <Tag color={getSeverityColor(selectedNC.severity)}>
                  {selectedNC.severity.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={getStatusColor(selectedNC.status)}>
                  {selectedNC.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description">{selectedNC.description}</Descriptions.Item>
              <Descriptions.Item label="N° Lot">{selectedNC.lot_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="Ordre de Production">{selectedNC.production_order_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="Détecté le">
                {moment(selectedNC.detected_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {selectedNC.closed_at && (
                <Descriptions.Item label="Clôturé le">
                  {moment(selectedNC.closed_at).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {selectedNC.resolution_notes && (
                <Descriptions.Item label="Notes de résolution">
                  {selectedNC.resolution_notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Drawer>
      </div>
    </Layout>
  );
};

export default NonConformityList;
