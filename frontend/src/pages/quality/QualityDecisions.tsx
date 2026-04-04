import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, Space, message, Spin, InputNumber, Alert, Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { qualityDecisionApi, nonConformityApi } from '../../services/quality/qualityApi';
import { QualityDecision, DecisionType, DecisionStatus, QualityDecisionCreate, NonConformity, NCStatus } from '../../types/quality.types';
import Layout from '../../components/common/Layout';
import moment from 'moment';

const { TextArea } = Input;

const QualityDecisions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<QualityDecision[]>([]);
  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [showPending, setShowPending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<QualityDecision | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [showPending]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [decisionsData, ncsData] = await Promise.all([
        showPending ? qualityDecisionApi.getPending() : qualityDecisionApi.getAll(),
        nonConformityApi.getAll({ status: NCStatus.CLOTUREE }),
      ]);
      setDecisions(decisionsData);
      setNcs(ncsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données');
      // Mock data for demo
      setDecisions([
        {
          id: '1',
          nc_id: '1',
          decision_type: DecisionType.A_RETRAVAILLER,
          status: DecisionStatus.EN_ATTENTE,
          notes: 'Le profilé doit être retravaillé',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updated_at: new Date(),
        },
        {
          id: '2',
          nc_id: '2',
          decision_type: DecisionType.REBUT,
          status: DecisionStatus.APPROUVE,
          approved_by: 'manager-1',
          approved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Défaut irréparable',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          nc_id: '3',
          decision_type: DecisionType.CONFORME,
          status: DecisionStatus.EN_ATTENTE,
          notes: 'Produit conforme après vérification',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      
      setNcs([
        {
          id: '1',
          nc_number: 'NC-2026-0001',
          description: 'Surface scratch detected on profile',
          severity: 'MAJEUR' as any,
          status: NCStatus.CLOTUREE,
          detected_by: 'user-1',
          detected_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updated_at: new Date(),
        },
        {
          id: '2',
          nc_number: 'NC-2026-0002',
          description: 'Dimensional deviation exceeds tolerance',
          severity: 'CRITIQUE' as any,
          status: NCStatus.CLOTUREE,
          detected_by: 'user-1',
          detected_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
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

  const handleView = (decision: QualityDecision) => {
    setSelectedDecision(decision);
    setViewModalVisible(true);
  };

  const handleApprove = async (decision: QualityDecision) => {
    try {
      await qualityDecisionApi.approve(decision.id);
      message.success('Décision approuvée');
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de l\'approbation de la décision');
    }
  };

  const handleReject = async (decision: QualityDecision) => {
    try {
      await qualityDecisionApi.reject(decision.id, 'Rejeté par le responsable qualité');
      message.success('Décision rejetée');
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors du rejet de la décision');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await qualityDecisionApi.create({
        ...values,
        approved_at: new Date().toISOString(),
      } as QualityDecisionCreate);
      message.success('Décision qualité créée');
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la création de la décision');
    }
  };

  const getStatusColor = (status: DecisionStatus) => {
    const colors: Record<DecisionStatus, string> = {
      [DecisionStatus.EN_ATTENTE]: 'orange',
      [DecisionStatus.APPROUVE]: 'green',
      [DecisionStatus.REJETE]: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: DecisionStatus) => {
    const labels: Record<DecisionStatus, string> = {
      [DecisionStatus.EN_ATTENTE]: 'En attente',
      [DecisionStatus.APPROUVE]: 'Approuvé',
      [DecisionStatus.REJETE]: 'Rejeté',
    };
    return labels[status] || status;
  };

  const getDecisionTypeLabel = (type: DecisionType) => {
    const labels: Record<DecisionType, string> = {
      [DecisionType.CONFORME]: 'Conforme',
      [DecisionType.NON_CONFORME]: 'Non Conforme',
      [DecisionType.A_RETRAVAILLER]: 'A Retravailler',
      [DecisionType.REBUT]: 'Rebut',
      [DecisionType.DEROGATION]: 'Dérogation',
    };
    return labels[type];
  };

  const columns = [
    {
      title: 'NC',
      key: 'nc',
      render: (_: any, record: QualityDecision) => {
        const nc = ncs.find(n => n.id === record.nc_id);
        return nc?.nc_number || record.nc_id;
      },
    },
    {
      title: 'Type de Décision',
      dataIndex: 'decision_type',
      key: 'decision_type',
      render: (type: DecisionType) => getDecisionTypeLabel(type),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: DecisionStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: QualityDecision) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Voir
          </Button>
          {record.status === DecisionStatus.EN_ATTENTE && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
                style={{ color: 'green' }}
              >
                Approuver
              </Button>
              <Button
                type="link"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
                danger
              >
                Rejeter
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout title="Décisions Qualité" subtitle="Traitement des décisions qualité">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Décisions Qualité" subtitle="Traitement des décisions qualité">
      <div className="quality-decisions-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space>
            <Button 
              type={showPending ? 'primary' : 'default'}
              onClick={() => setShowPending(!showPending)}
            >
              {showPending ? 'Afficher tout' : 'En attente uniquement'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Actualiser</Button>
          </Space>
          <Button type="primary" onClick={handleCreate}>
            Nouvelle Décision
          </Button>
        </div>

        {error && (
          <Alert message="Erreur" description={error} type="error" showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Card>
          <Table
            dataSource={decisions}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Aucune décision qualité trouvée' }}
          />
        </Card>

        <Modal
          title="Créer une Décision Qualité"
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => setModalVisible(false)}
          width={600}
          okText="Créer"
          cancelText="Annuler"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="nc_id"
              label="Non-Conformité"
              rules={[{ required: true, message: 'Veuillez sélectionner une NC' }]}
            >
              <Select>
                {ncs.map(nc => (
                  <Select.Option key={nc.id} value={nc.id}>
                    {nc.nc_number} - {nc.description.substring(0, 50)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="decision_type"
              label="Type de Décision"
              rules={[{ required: true, message: 'Veuillez sélectionner le type de décision' }]}
            >
              <Select>
                <Select.Option value={DecisionType.CONFORME}>Conforme</Select.Option>
                <Select.Option value={DecisionType.NON_CONFORME}>Non Conforme</Select.Option>
                <Select.Option value={DecisionType.A_RETRAVAILLER}>A Retravailler</Select.Option>
                <Select.Option value={DecisionType.REBUT}>Rebut</Select.Option>
                <Select.Option value={DecisionType.DEROGATION}>Dérogation</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Quantité Affectée"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="notes" label="Notes">
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Détails de la Décision Qualité"
          open={viewModalVisible}
          onOk={() => setViewModalVisible(false)}
          onCancel={() => setViewModalVisible(false)}
          width={600}
          okText="Fermer"
        >
          {selectedDecision && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>NC:</strong> {ncs.find(n => n.id === selectedDecision.nc_id)?.nc_number || selectedDecision.nc_id}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Décision:</strong> {getDecisionTypeLabel(selectedDecision.decision_type)}</p>
                </Col>
              </Row>
              <p><strong>Statut:</strong> <Tag color={getStatusColor(selectedDecision.status)}>{getStatusLabel(selectedDecision.status)}</Tag></p>
              <p><strong>Notes:</strong> {selectedDecision.notes || '-'}</p>
              <p><strong>Créé le:</strong> {moment(selectedDecision.created_at).format('DD/MM/YYYY HH:mm')}</p>
              {selectedDecision.approved_at && (
                <p><strong>Approuvé le:</strong> {moment(selectedDecision.approved_at).format('DD/MM/YYYY HH:mm')}</p>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default QualityDecisions;
