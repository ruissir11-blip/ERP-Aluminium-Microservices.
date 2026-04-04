import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, DatePicker, Space, message, Spin, Alert, Row, Col } from 'antd';
import { PlusOutlined, CheckOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { correctiveActionApi, nonConformityApi } from '../../services/quality/qualityApi';
import { CorrectiveAction, CorrectiveActionStatus, CorrectiveActionCreate, NonConformity, NCStatus } from '../../types/quality.types';
import Layout from '../../components/common/Layout';
import moment from 'moment';

const { TextArea } = Input;

const CorrectiveActions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [form] = Form.useForm();
  const [verifyForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [actionsData, ncsData] = await Promise.all([
        correctiveActionApi.getAll(),
        nonConformityApi.getAll({ status: NCStatus.CLOTUREE }),
      ]);
      setActions(actionsData);
      setNcs(ncsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données');
      // Mock data for demo
      setActions([
        {
          id: '1',
          nc_id: '1',
          description: 'Remplacer l\'outil usagé',
          assigned_to: 'tech-1',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: CorrectiveActionStatus.A_FAIRE,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          nc_id: '2',
          description: 'Former l\'opérateur sur les procédures',
          assigned_to: 'tech-2',
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: CorrectiveActionStatus.TERMINE,
          completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          nc_id: '1',
          description: 'Vérifier les paramètres de soudure',
          assigned_to: 'tech-1',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: CorrectiveActionStatus.EN_COURS,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updated_at: new Date(),
        },
        {
          id: '4',
          nc_id: '3',
          description: 'Ajuster le four de séchage',
          assigned_to: 'tech-3',
          due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: CorrectiveActionStatus.VERIFIE,
          completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          effectiveness_verification: 'Température stable depuis 1 semaine',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
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
          detected_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          nc_number: 'NC-2026-0002',
          description: 'Dimensional deviation exceeds tolerance',
          severity: 'CRITIQUE' as any,
          status: NCStatus.CLOTUREE,
          detected_by: 'user-1',
          detected_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '3',
          nc_number: 'NC-2026-0003',
          description: 'Color variation outside tolerance',
          severity: 'MINEUR' as any,
          status: NCStatus.CLOTUREE,
          detected_by: 'user-2',
          detected_at: new Date(),
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

  const handleComplete = async (action: CorrectiveAction) => {
    try {
      await correctiveActionApi.complete(action.id);
      message.success('Action terminée');
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la terminaison de l\'action');
    }
  };

  const handleVerify = (action: CorrectiveAction) => {
    setSelectedAction(action);
    setVerifyModalVisible(true);
  };

  const handleVerifySubmit = async () => {
    try {
      const values = await verifyForm.validateFields();
      await correctiveActionApi.verify(selectedAction!.id, values.verification);
      message.success('Action vérifiée');
      setVerifyModalVisible(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la vérification de l\'action');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await correctiveActionApi.create({
        ...values,
        due_date: values.due_date.toDate(),
      } as CorrectiveActionCreate);
      message.success('Action corrective créée');
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de la création de l\'action');
    }
  };

  const getStatusColor = (status: CorrectiveActionStatus) => {
    const colors: Record<CorrectiveActionStatus, string> = {
      [CorrectiveActionStatus.A_FAIRE]: 'red',
      [CorrectiveActionStatus.EN_COURS]: 'orange',
      [CorrectiveActionStatus.TERMINE]: 'blue',
      [CorrectiveActionStatus.VERIFIE]: 'green',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: CorrectiveActionStatus) => {
    const labels: Record<CorrectiveActionStatus, string> = {
      [CorrectiveActionStatus.A_FAIRE]: 'A faire',
      [CorrectiveActionStatus.EN_COURS]: 'En cours',
      [CorrectiveActionStatus.TERMINE]: 'Terminé',
      [CorrectiveActionStatus.VERIFIE]: 'Vérifié',
    };
    return labels[status] || status;
  };

  const isOverdue = (action: CorrectiveAction) => {
    return action.status !== CorrectiveActionStatus.VERIFIE && 
           moment(action.due_date).isBefore(moment());
  };

  const columns = [
    {
      title: 'NC',
      key: 'nc',
      render: (_: any, record: CorrectiveAction) => {
        const nc = ncs.find(n => n.id === record.nc_id);
        return nc?.nc_number || record.nc_id;
      },
    },
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
      render: (status: CorrectiveActionStatus, record: CorrectiveAction) => (
        <Tag color={getStatusColor(status)}>
          {isOverdue(record) ? 'EN RETARD - ' : ''}{getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Date limite',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: Date, record: CorrectiveAction) => (
        <span style={{ color: isOverdue(record) ? 'red' : 'inherit' }}>
          {moment(date).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CorrectiveAction) => (
        <Space>
          {record.status === CorrectiveActionStatus.A_FAIRE && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record)}
            >
              Commencer
            </Button>
          )}
          {record.status === CorrectiveActionStatus.TERMINE && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleVerify(record)}
            >
              Vérifier
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout title="Actions Correctives" subtitle="Suivi des actions correctives">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Actions Correctives" subtitle="Suivi des actions correctives">
      <div className="corrective-actions-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Actualiser</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouvelle Action
          </Button>
        </div>

        {error && (
          <Alert message="Erreur" description={error} type="error" showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Card>
          <Table
            dataSource={actions}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Aucune action corrective trouvée' }}
          />
        </Card>

        <Modal
          title="Créer une Action corrective"
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
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Veuillez entrer une description' }]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="assigned_to"
              label="Assigné à"
            >
              <Input placeholder="ID de l'intervenant" />
            </Form.Item>

            <Form.Item
              name="due_date"
              label="Date limite"
              rules={[{ required: true, message: 'Veuillez sélectionner une date limite' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Vérifier l'Action corrective"
          open={verifyModalVisible}
          onOk={handleVerifySubmit}
          onCancel={() => setVerifyModalVisible(false)}
          okText="Vérifier"
          cancelText="Annuler"
        >
          <Form form={verifyForm} layout="vertical">
            <Form.Item
              name="verification"
              label="Vérification d'efficacité"
              rules={[{ required: true, message: 'Veuillez entrer les notes de vérification' }]}
            >
              <TextArea rows={4} placeholder="Décrivez comment l'efficacité a été vérifiée..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default CorrectiveActions;
