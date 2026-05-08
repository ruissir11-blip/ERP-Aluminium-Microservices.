import React, { useEffect, useState } from 'react';
import { Tabs, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import Layout from '../../components/common/Layout';
import { employeeApi } from '../../services/hrApi';
import { departmentApi } from '../../services/hrApi';
import { Employee, Department } from '../../types/hr.types';

const { TabPane } = Tabs;

const HRManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [employeeForm] = Form.useForm();
  const [departmentForm] = Form.useForm();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const result = await employeeApi.list();
      setEmployees(result.employees || []);
    } catch (err) {
      message.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const result = await departmentApi.list();
      setDepartments(result);
    } catch (err) {
      message.error('Erreur lors du chargement des départements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    else fetchDepartments();
  }, [activeTab]);

  const handleEmployeeSubmit = async (values: any) => {
    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, values);
        message.success('Employé mis à jour');
      } else {
        await employeeApi.create(values);
        message.success('Employé créé');
      }
      setEmployeeModalVisible(false);
      employeeForm.resetFields();
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      message.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDepartmentSubmit = async (values: any) => {
    try {
      if (editingDepartment) {
        await departmentApi.update(editingDepartment.id, values);
        message.success('Département mis à jour');
      } else {
        await departmentApi.create(values);
        message.success('Département créé');
      }
      setDepartmentModalVisible(false);
      departmentForm.resetFields();
      setEditingDepartment(null);
      fetchDepartments();
    } catch (err) {
      message.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await employeeApi.archive(id);
      message.success('Employé archivé');
      fetchEmployees();
    } catch {
      message.error('Erreur lors de l\'archivage');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await departmentApi.delete(id);
      message.success('Département supprimé');
      fetchDepartments();
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const getDepartmentName = (deptId?: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : '-';
  };

  return (
    <Layout title="Gestion RH" subtitle="Employés et départements">
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <TabPane tab={
          <span>
            <UserOutlined />
            Employés
          </span>
        } key="employees">
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingEmployee(null); employeeForm.resetFields(); setEmployeeModalVisible(true); }}>
              Nouvel Employé
            </Button>
          </div>
          <table className="w-full bg-white rounded shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Département</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-t">
                  <td className="px-4 py-2">{emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-2">{emp.email}</td>
                  <td className="px-4 py-2">{getDepartmentName(emp.departmentId)}</td>
                  <td className="px-4 py-2"><Tag color={emp.isActive ? 'green' : 'red'}>{emp.isActive ? 'Actif' : 'Inactif'}</Tag></td>
                  <td className="px-4 py-2 text-right">
                    <Space>
                      <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingEmployee(emp); employeeForm.setFieldsValue(emp); setEmployeeModalVisible(true); }} />
                      <Popconfirm title="Supprimer cet employé ?" onConfirm={() => handleDeleteEmployee(emp.id)}>
                        <Button danger icon={<DeleteOutlined />} size="small" />
                      </Popconfirm>
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabPane>

        <TabPane tab={
          <span>
            <TeamOutlined />
            Départements
          </span>
        } key="departments">
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingDepartment(null); departmentForm.resetFields(); setDepartmentModalVisible(true); }}>
              Nouveau Département
            </Button>
          </div>
          <table className="w-full bg-white rounded shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => (
                <tr key={dept.id} className="border-t">
                  <td className="px-4 py-2">{dept.name}</td>
                  <td className="px-4 py-2">{dept.code}</td>
                  <td className="px-4 py-2">{dept.description || '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <Space>
                      <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingDepartment(dept); departmentForm.setFieldsValue(dept); setDepartmentModalVisible(true); }} />
                      <Popconfirm title="Supprimer ce département ?" onConfirm={() => handleDeleteDepartment(dept.id)}>
                        <Button danger icon={<DeleteOutlined />} size="small" />
                      </Popconfirm>
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabPane>
      </Tabs>

      {/* Employee Modal */}
      <Modal
        title={editingEmployee ? 'Modifier Employé' : 'Nouvel Employé'}
        open={employeeModalVisible}
        onCancel={() => { setEmployeeModalVisible(false); setEditingEmployee(null); }}
        footer={null}
      >
        <Form form={employeeForm} layout="vertical" onFinish={handleEmployeeSubmit}>
          <Form.Item name="firstName" label="Prénom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="departmentId" label="Département">
            <Select allowClear>
              {departments.map(d => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Enregistrer</Button>
              <Button onClick={() => setEmployeeModalVisible(false)}>Annuler</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Department Modal */}
      <Modal
        title={editingDepartment ? 'Modifier Département' : 'Nouveau Département'}
        open={departmentModalVisible}
        onCancel={() => { setDepartmentModalVisible(false); setEditingDepartment(null); }}
        footer={null}
      >
        <Form form={departmentForm} layout="vertical" onFinish={handleDepartmentSubmit}>
          <Form.Item name="name" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Enregistrer</Button>
              <Button onClick={() => setDepartmentModalVisible(false)}>Annuler</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default HRManagement;
