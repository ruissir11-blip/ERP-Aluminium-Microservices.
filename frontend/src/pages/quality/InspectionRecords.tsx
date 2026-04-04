import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, Space, message, Spin, Alert, Row, Col } from 'antd';
import { PlusOutlined, CheckOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { inspectionRecordApi, inspectionPointApi } from '../../services/quality/qualityApi';
import { InspectionRecord, InspectionStatus, InspectionResult, InspectionRecordCreate, InspectionPoint } from '../../types/quality.types';
import Layout from '../../components/common/Layout';
import moment from 'moment';

const { TextArea } = Input;

const InspectionRecords: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [points, setPoints] = useState<InspectionPoint[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsData, pointsData] = await Promise.all([
        inspectionRecordApi.getAll(),
        inspectionPointApi.getAll(),
      ]);
      setRecords(recordsData);
      setPoints(pointsData.filter((p: InspectionPoint) => p.is_active));
    } catch (err: any) {
      console.error('Failed to load inspection records:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des enregistrements d\'inspection');
      // Mock data for demo
      setRecords([
        {
          id: '1',
          production_order_id: 'PO-2026-0001',
          inspection_point_id: '1',
          inspector_id: 'user-1',
          status: InspectionStatus.COMPLETED,
          result: InspectionResult.CONFORME,
          observations: 'Tout est conforme',
          completed_at: new Date(),
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updated_at: new Date(),
        },
        {
          id: '2',
          production_order_id: 'PO-2026-0002',
          inspection_point_id: '2',
          inspector_id: 'user-2',
          status: InspectionStatus.IN_PROGRESS,
          result: InspectionResult.EN_ATTENTE,
          observations: '',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '3',
          production_order_id: 'PO-2026-0003',
          inspection_point_id: '1',
          inspector_id: 'user-1',
          status: InspectionStatus.PENDING,
          result: InspectionResult.EN_ATTENTE,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '4',
          production_order_id: 'PO-2026-0004',
          inspection_point_id: '3',
          inspector_id: 'user-3',
          status: InspectionStatus.COMPLETED,
          result: InspectionResult.NON_CONFORME,
          observations: 'Variation de couleur détectée',
          completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 25 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ]);
      
      setPoints([
        {
          id: '1',
          production_stage: 'CUTTING' as any,
          name: 'Vérification des dimensions',
          description: 'Contrôle des dimensions du profilé après coupe',
          is_mandatory: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          production_stage: 'ASSEMBLY' as any,
          name: 'Vérification soudure',
          description: 'Contrôle visuel des soudures',
          is_mandatory: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '3',
          production_stage: 'FINISHING' as any,
          name: 'Contrôle qualité peinture',
          description: 'Vérification de l\'uniformité de la peinture',
          is_mandatory: false,
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
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = async (record: InspectionRecord) => {
    setSelectedRecord(record);
    setViewModalVisible(true);
  };

  const handleComplete = async (record: InspectionRecord) => {
    try {
      await inspectionRecordApi.complete(record.id, {
        status: InspectionStatus.COMPLETED,
        result: record.result,
      });
      message.success('Inspection terminée');
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la terminaison de l\'inspection');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await inspectionRecordApi.create(values as InspectionRecordCreate);
      message.success('Enregistrement d\'inspection créé');
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la création de l\'enregistrement');
    }
  };

  const getStatusColor = (status: InspectionStatus) => {
    const colors: Record<InspectionStatus, string> = {
      [InspectionStatus.PENDING]: 'orange',
      [InspectionStatus.IN_PROGRESS]: 'blue',
      [InspectionStatus.COMPLETED]: 'green',
      [InspectionStatus.CANCELLED]: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: InspectionStatus) => {
    const labels: Record<InspectionStatus, string> = {
      [InspectionStatus.PENDING]: 'En attente',
      [InspectionStatus.IN_PROGRESS]: 'En cours',
      [InspectionStatus.COMPLETED]: 'Terminé',
      [InspectionStatus.CANCELLED]: 'Annulé',
    };
    return labels[status] || status;
  };

  const getResultColor = (result: InspectionResult) => {
    const colors: Record<InspectionResult, string> = {
      [InspectionResult.CONFORME]: 'green',
      [InspectionResult.NON_CONFORME]: 'red',
      [InspectionResult.EN_ATTENTE]: 'orange',
    };
    return colors[result] || 'default';
  };

  const getResultLabel = (result: InspectionResult) => {
    const labels: Record<InspectionResult, string> = {
      [InspectionResult.CONFORME]: 'Conforme',
      [InspectionResult.NON_CONFORME]: 'Non conforme',
      [InspectionResult.EN_ATTENTE]: 'En attente',
    };
    return labels[result] || result;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => id.substring(0, 8),
    },
    {
      title: 'Point d\'Inspection',
      dataIndex: 'inspection_point_id',
      key: 'inspection_point',
      render: (_: any, record: InspectionRecord) => {
        const point = points.find(p => p.id === record.inspection_point_id);
        return point?.name || '-';
      },
    },
    {
      title: 'Ordre de Production',
      dataIndex: 'production_order_id',
      key: 'production_order_id',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: InspectionStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Résultat',
      dataIndex: 'result',
      key: 'result',
      render: (result: InspectionResult) => (
        <Tag color={getResultColor(result)}>{getResultLabel(result)}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => moment(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: InspectionRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Voir
          </Button>
          {record.status !== InspectionStatus.COMPLETED && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record)}
            >
              Terminer
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout title="Enregistrements d'Inspection" subtitle="Suivi des inspections réalisées">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enregistrements d'Inspection" subtitle="Suivi des inspections réalisées">
      <div className="inspection-records-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Actualiser</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouvelle Inspection
          </Button>
        </div>

        {error && (
          <Alert message="Erreur" description={error} type="error" showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Card>
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Aucun enregistrement d\'inspection trouvé' }}
          />
        </Card>

        <Modal
          title="Créer un Enregistrement d'Inspection"
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => setModalVisible(false)}
          width={600}
          okText="Créer"
          cancelText="Annuler"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="inspection_point_id"
              label="Point d'Inspection"
              rules={[{ required: true, message: 'Veuillez sélectionner un point d\'inspection' }]}
            >
              <Select>
                {points.map(point => (
                  <Select.Option key={point.id} value={point.id}>
                    {point.name} ({point.production_stage})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="production_order_id"
              label="N° Ordre de Production"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="inspector_id"
              label="Inspecteur"
              rules={[{ required: true, message: 'Veuillez entrer l\'ID de l\'inspecteur' }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Détails de l'Inspection"
          open={viewModalVisible}
          onOk={() => setViewModalVisible(false)}
          onCancel={() => setViewModalVisible(false)}
          width={600}
          okText="Fermer"
        >
          {selectedRecord && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Statut:</strong> <Tag color={getStatusColor(selectedRecord.status)}>{getStatusLabel(selectedRecord.status)}</Tag></p>
                </Col>
                <Col span={12}>
                  <p><strong>Résultat:</strong> <Tag color={getResultColor(selectedRecord.result)}>{getResultLabel(selectedRecord.result)}</Tag></p>
                </Col>
              </Row>
              <p><strong>Observations:</strong> {selectedRecord.observations || '-'}</p>
              <p><strong>Créé le:</strong> {moment(selectedRecord.created_at).format('DD/MM/YYYY HH:mm')}</p>
              {selectedRecord.completed_at && (
                <p><strong>Terminé le:</strong> {moment(selectedRecord.completed_at).format('DD/MM/YYYY HH:mm')}</p>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default InspectionRecords;
