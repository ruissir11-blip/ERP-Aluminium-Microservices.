import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, Switch, Space, message, Spin, Alert, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { inspectionPointApi } from '../../services/quality/qualityApi';
import { InspectionPoint, ProductionStage, InspectionPointCreate } from '../../types/quality.types';
import Layout from '../../components/common/Layout';

const { TextArea } = Input;

const InspectionPoints: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<InspectionPoint[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPoint, setEditingPoint] = useState<InspectionPoint | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inspectionPointApi.getAll();
      setPoints(data);
    } catch (err: any) {
      console.error('Failed to load inspection points:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des points d\'inspection');
      // Mock data for demo
      setPoints([
        {
          id: '1',
          production_stage: ProductionStage.CUTTING,
          name: 'Vérification des dimensions',
          description: 'Contrôle des dimensions du profilé après coupe',
          is_mandatory: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          production_stage: ProductionStage.ASSEMBLY,
          name: 'Vérification soudure',
          description: 'Contrôle visuel des soudures',
          is_mandatory: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '3',
          production_stage: ProductionStage.FINISHING,
          name: 'Contrôle qualité peinture',
          description: 'Vérification de l\'uniformité de la peinture',
          is_mandatory: false,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '4',
          production_stage: ProductionStage.PACKING,
          name: 'Vérification包装',
          description: 'Contrôle de l\'emballage et de l\'étiquetage',
          is_mandatory: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPoint(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (point: InspectionPoint) => {
    setEditingPoint(point);
    form.setFieldsValue(point);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await inspectionPointApi.delete(id);
      message.success('Point d\'inspection supprimé');
      loadPoints();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression du point d\'inspection');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPoint) {
        await inspectionPointApi.update(editingPoint.id, values);
        message.success('Point d\'inspection mis à jour');
      } else {
        await inspectionPointApi.create(values as InspectionPointCreate);
        message.success('Point d\'inspection créé');
      }
      setModalVisible(false);
      loadPoints();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement du point d\'inspection');
    }
  };

  const getStageColor = (stage: ProductionStage) => {
    const colors: Record<ProductionStage, string> = {
      [ProductionStage.CUTTING]: 'blue',
      [ProductionStage.ASSEMBLY]: 'green',
      [ProductionStage.FINISHING]: 'purple',
      [ProductionStage.PACKING]: 'orange',
      [ProductionStage.SHIPPING]: 'cyan',
    };
    return colors[stage] || 'default';
  };

  const getStageLabel = (stage: ProductionStage) => {
    const labels: Record<ProductionStage, string> = {
      [ProductionStage.CUTTING]: 'Coupe',
      [ProductionStage.ASSEMBLY]: 'Assemblage',
      [ProductionStage.FINISHING]: 'Finition',
      [ProductionStage.PACKING]: 'Emballage',
      [ProductionStage.SHIPPING]: 'Expédition',
    };
    return labels[stage] || stage;
  };

  const columns = [
    {
      title: 'Étape',
      dataIndex: 'production_stage',
      key: 'production_stage',
      render: (stage: ProductionStage) => (
        <Tag color={getStageColor(stage)}>{getStageLabel(stage)}</Tag>
      ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Obligatoire',
      dataIndex: 'is_mandatory',
      key: 'is_mandatory',
      render: (isMandatory: boolean) => (
        <Tag color={isMandatory ? 'red' : 'default'}>
          {isMandatory ? 'Oui' : 'Non'}
        </Tag>
      ),
    },
    {
      title: 'Actif',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: InspectionPoint) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout title="Points d'Inspection" subtitle="Configuration des points de contrôle qualité">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Points d'Inspection" subtitle="Configuration des points de contrôle qualité">
      <div className="inspection-points-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadPoints}>Actualiser</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Ajouter un Point d'Inspection
          </Button>
        </div>

        {error && (
          <Alert message="Erreur" description={error} type="error" showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Card>
          <Table
            dataSource={points}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Aucun point d\'inspection trouvé' }}
          />
        </Card>

        <Modal
          title={editingPoint ? 'Modifier le Point d\'Inspection' : 'Créer un Point d\'Inspection'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => setModalVisible(false)}
          width={600}
          okText={editingPoint ? 'Mettre à jour' : 'Créer'}
          cancelText="Annuler"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="production_stage"
              label="Étape de Production"
              rules={[{ required: true, message: 'Veuillez sélectionner l\'étape de production' }]}
            >
              <Select>
                <Select.Option value={ProductionStage.CUTTING}>Coupe</Select.Option>
                <Select.Option value={ProductionStage.ASSEMBLY}>Assemblage</Select.Option>
                <Select.Option value={ProductionStage.FINISHING}>Finition</Select.Option>
                <Select.Option value={ProductionStage.PACKING}>Emballage</Select.Option>
                <Select.Option value={ProductionStage.SHIPPING}>Expédition</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="name"
              label="Nom"
              rules={[{ required: true, message: 'Veuillez entrer le nom' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={3} />
            </Form.Item>

            <Row>
              <Col span={12}>
                <Form.Item name="is_mandatory" label="Obligatoire" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="is_active" label="Actif" valuePropName="checked">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default InspectionPoints;
