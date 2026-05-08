import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  message, 
  Card, 
  Row, 
  Col, 
  Statistic,
  Popconfirm,
  Drawer,
  Descriptions,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  PrinterOutlined,
  SwapOutlined
} from '@ant-design/icons';
import Layout from '../components/common/Layout';
import moment from 'moment';
import { quoteApi } from '../services/aluminium/quoteApi';
import { Quote, QuoteStatus, Customer } from '../types/aluminium.types';
import { profileApi } from '../services/aluminium/profileApi';
import { customerService } from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

const QuoteList: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'ALL'>('ALL');
  const [form] = Form.useForm();
  const [lineForm] = Form.useForm();
  const [lineModalVisible, setLineModalVisible] = useState(false);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    refused: 0
  });

  useEffect(() => {
    fetchQuotes();
    fetchCustomers();
  }, [statusFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }
      const response = await quoteApi.getAll(filters);
      setQuotes(response.data.data || []);
      
      // Calculate stats
      const data = response.data.data || [];
      setStats({
        total: data.length,
        pending: data.filter((q: Quote) => q.status === 'ENVOYÉ' || q.status === 'BROUILLON').length,
        accepted: data.filter((q: Quote) => q.status === 'ACCEPTÉ').length,
        refused: data.filter((q: Quote) => q.status === 'REFUSÉ').length
      });
    } catch (error: any) {
      message.error('Erreur lors du chargement des devis: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getActive();
      if (response.data.success) {
        setCustomers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreate = () => {
    setEditingQuote(null);
    form.resetFields();
    form.setFieldValue('validUntil', moment().add(30, 'days'));
    setModalVisible(true);
  };

  const handleEdit = (record: Quote) => {
    setEditingQuote(record);
    form.setFieldsValue({
      ...record,
      validUntil: moment(record.validUntil)
    });
    setModalVisible(true);
  };

  const handleView = async (record: Quote) => {
    try {
      const response = await quoteApi.getById(record.id);
      setSelectedQuote(response.data.data);
      setDetailVisible(true);
    } catch (error: any) {
      message.error('Erreur lors du chargement du devis');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      message.success('Devis supprimé avec succès');
      fetchQuotes();
    } catch (error: any) {
      message.error('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleSend = async (id: string) => {
    try {
      await quoteApi.send(id);
      message.success('Devis envoyé au client');
      fetchQuotes();
    } catch (error: any) {
      message.error('Erreur lors de l\'envoi: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await quoteApi.accept(id);
      message.success('Devis accepté');
      fetchQuotes();
    } catch (error: any) {
      message.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleRefuse = async (id: string) => {
    try {
      await quoteApi.refuse(id);
      message.success('Devis refusé');
      fetchQuotes();
    } catch (error: any) {
      message.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleConvertToOrder = async (id: string) => {
    try {
      await quoteApi.convertToOrder(id);
      message.success('Devis converti en commande');
      fetchQuotes();
    } catch (error: any) {
      message.error('Erreur lors de la conversion: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handlePrint = async (quote: Quote) => {
    try {
      const response = await quoteApi.generatePdf(quote.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${quote.quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      message.error('Erreur lors de l\'impression: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        validUntil: values.validUntil.toISOString()
      };
      
      if (editingQuote) {
        // Update existing quote
        await fetch(`/api/quotes/${editingQuote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(data)
        });
        message.success('Devis mis à jour');
      } else {
        // Create new quote
        await quoteApi.create(data);
        message.success('Devis créé');
      }
      
      setModalVisible(false);
      fetchQuotes();
    } catch (error: any) {
      message.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'BROUILLON':
        return 'default';
      case 'ENVOYÉ':
        return 'processing';
      case 'ACCEPTÉ':
        return 'success';
      case 'REFUSÉ':
        return 'error';
      case 'EXPIRÉ':
        return 'warning';
      case 'ANNULÉ':
        return 'default';
      case 'ARCHIVÉ':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'N° Devis',
      dataIndex: 'quoteNumber',
      key: 'quoteNumber',
      render: (text: string, record: Quote) => (
        <a onClick={() => handleView(record)}>{text}</a>
      )
    },
    {
      title: 'Client',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: Customer) => customer?.companyName || '-'
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: QuoteStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: 'Total (DT)',
      dataIndex: 'total',
      key: 'total',
      render: (total: number | string) => {
        const num = typeof total === 'string' ? parseFloat(total) : total;
        return num?.toFixed?.(3) || '0.000';
      }
    },
    {
      title: 'Valide jusqu\'au',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (date: string) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Date création',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Quote) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
            title="Voir"
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            title="Modifier"
          />
          {record.status === 'BROUILLON' && (
            <Button 
              type="text" 
              icon={<SendOutlined />} 
              onClick={() => handleSend(record.id)}
              title="Envoyer"
            />
          )}
          {record.status === 'ENVOYÉ' && (
            <>
              <Button 
                type="text" 
                icon={<CheckOutlined />} 
                onClick={() => handleAccept(record.id)}
                title="Accepter"
                style={{ color: '#52c41a' }}
              />
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={() => handleRefuse(record.id)}
                title="Refuser"
                style={{ color: '#ff4d4f' }}
              />
            </>
          )}
          {record.status === 'ACCEPTÉ' && (
            <Button 
              type="text" 
              icon={<SwapOutlined />} 
              onClick={() => handleConvertToOrder(record.id)}
              title="Convertir en commande"
            />
          )}
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce devis?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger
              title="Supprimer"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout title="Devis" subtitle="Gestion des devis et conversions en commandes">
      <div className="quote-list-page">
        {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Devis" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="En attente" 
              value={stats.pending} 
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Acceptés" 
              value={stats.accepted} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Refusés" 
              value={stats.refused} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="ALL">Tous les statuts</Option>
              <Option value="BROUILLON">Brouillon</Option>
              <Option value="ENVOYÉ">Envoyé</Option>
              <Option value="ACCEPTÉ">Accepté</Option>
              <Option value="REFUSÉ">Refusé</Option>
              <Option value="EXPIRÉ">Expiré</Option>
              <Option value="ANNULÉ">Annulé</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouveau Devis
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingQuote ? 'Modifier le devis' : 'Nouveau devis'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="customerId"
            label="Client"
            rules={[{ required: true, message: 'Veuillez sélectionner un client' }]}
          >
            <Select
              showSearch
              placeholder="Sélectionner un client"
              optionFilterProp="children"
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.companyName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="validUntil"
            label="Valide jusqu'au"
            rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingQuote ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={`Devis ${selectedQuote?.quoteNumber || ''}`}
        placement="right"
        width={700}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedQuote && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Client">
                {selectedQuote.customer?.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={getStatusColor(selectedQuote.status)}>
                  {selectedQuote.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sous-total">
                {typeof selectedQuote.subtotal === 'string' ? parseFloat(selectedQuote.subtotal).toFixed(3) : selectedQuote.subtotal?.toFixed(3)} DT
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <strong>{typeof selectedQuote.total === 'string' ? parseFloat(selectedQuote.total).toFixed(3) : selectedQuote.total?.toFixed(3)} DT</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Valide jusqu'au">
                {moment(selectedQuote.validUntil).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Créé le">
                {moment(selectedQuote.createdAt).format('DD/MM/YYYY')}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Articles du devis</Divider>

            {selectedQuote.lines && selectedQuote.lines.length > 0 ? (
              <Table
                dataSource={selectedQuote.lines}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Profilé',
                    dataIndex: 'profile',
                    key: 'profile',
                    render: (profile) => profile?.name || '-'
                  },
                  {
                    title: 'Qté',
                    dataIndex: 'quantity',
                    key: 'quantity'
                  },
                  {
                    title: 'Longueur',
                    dataIndex: 'unitLength',
                    key: 'unitLength',
                    render: (val) => `${val} mm`
                  },
                  {
                    title: 'Prix unit.',
                    dataIndex: 'unitPrice',
                    key: 'unitPrice',
                    render: (val) => `${typeof val === 'string' ? parseFloat(val).toFixed(3) : val?.toFixed(3)} DT`
                  },
                  {
                    title: 'Total',
                    dataIndex: 'lineTotal',
                    key: 'lineTotal',
                    render: (val) => `${typeof val === 'string' ? parseFloat(val).toFixed(3) : val?.toFixed(3)} DT`
                  }
                ]}
              />
            ) : (
              <p>Aucun article dans ce devis.</p>
            )}

            <Divider />

            <Space>
              {selectedQuote.status === 'BROUILLON' && (
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={() => {
                    handleSend(selectedQuote.id);
                    setDetailVisible(false);
                  }}
                >
                  Envoyer au client
                </Button>
              )}
              {selectedQuote.status === 'ENVOYÉ' && (
                <>
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={() => {
                      handleAccept(selectedQuote.id);
                      setDetailVisible(false);
                    }}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Accepter
                  </Button>
                  <Button 
                    danger 
                    icon={<CloseOutlined />}
                    onClick={() => {
                      handleRefuse(selectedQuote.id);
                      setDetailVisible(false);
                    }}
                  >
                    Refuser
                  </Button>
                </>
              )}
              {selectedQuote.status === 'ACCEPTÉ' && (
                <Button 
                  type="primary" 
                  icon={<SwapOutlined />}
                  onClick={() => {
                    handleConvertToOrder(selectedQuote.id);
                    setDetailVisible(false);
                  }}
                >
                  Convertir en commande
                </Button>
              )}
              <Button 
                icon={<PrinterOutlined />}
                onClick={() => handlePrint(selectedQuote)}
              >
                Imprimer
              </Button>
            </Space>
          </>
        )}
      </Drawer>
      </div>
    </Layout>
  );
};

export default QuoteList;
