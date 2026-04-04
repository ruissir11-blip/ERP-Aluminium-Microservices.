import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Input, Select, Form, message, Spin, Divider, List, Tag, Alert } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { rootCauseApi, nonConformityApi } from '../../services/quality/qualityApi';
import { NCRootCause, NonConformity, RootCauseMethod, RootCauseCategory, NCStatus } from '../../types/quality.types';
import Layout from '../../components/common/Layout';

const { TextArea } = Input;

interface RootCauseAnalysisProps {
  ncId?: string;
}

const RootCauseAnalysis: React.FC<RootCauseAnalysisProps> = ({ ncId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [selectedNC, setSelectedNC] = useState<string>(ncId || '');
  const [existingAnalysis, setExistingAnalysis] = useState<NCRootCause | null>(null);
  const [analyseType, setAnalyseType] = useState<RootCauseMethod>(RootCauseMethod.CINQ_POURQUOI);
  const [pourquoiResponses, setPourquoiResponses] = useState<string[]>(['', '', '', '', '']);
  const [ishikawaCategories, setIshikawaCategories] = useState<Record<string, string[]>>({
    [RootCauseCategory.MACHINE]: [''],
    [RootCauseCategory.METHODE]: [''],
    [RootCauseCategory.MATERIAU]: [''],
    [RootCauseCategory.HOMME]: [''],
    [RootCauseCategory.ENVIRONNEMENT]: [''],
    [RootCauseCategory.MESURE]: [''],
  });

  useEffect(() => {
    loadNCs();
  }, []);

  useEffect(() => {
    if (selectedNC) {
      loadExistingAnalysis();
    }
  }, [selectedNC]);

  const loadNCs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nonConformityApi.getAll({ status: NCStatus.OUVERTE });
      setNcs(data);
    } catch (err: any) {
      console.error('Failed to load non-conformities:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des non-conformités');
      // Mock data for demo
      setNcs([
        {
          id: '1',
          nc_number: 'NC-2026-0001',
          description: 'Surface scratch detected on profile',
          severity: 'MAJEUR' as any,
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
          severity: 'CRITIQUE' as any,
          status: NCStatus.OUVERTE,
          detected_by: 'user-1',
          detected_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAnalysis = async () => {
    try {
      const analyses = await rootCauseApi.getByNC(selectedNC);
      if (analyses.length > 0) {
        setExistingAnalysis(analyses[0]);
        if (analyses[0].method === RootCauseMethod.CINQ_POURQUOI) {
          setAnalyseType(RootCauseMethod.CINQ_POURQUOI);
          const responses = analyses[0].analysis_json as any;
          if (responses?.pourquoi) {
            setPourquoiResponses(responses.pourquoi);
          }
        } else {
          setAnalyseType(RootCauseMethod.ISHIKAWA);
          const categories = analyses[0].analysis_json as any;
          if (categories) {
            setIshikawaCategories(prev => {
              const updated = { ...prev };
              Object.keys(categories).forEach((key: string) => {
                updated[key] = Array.isArray(categories[key]) ? categories[key] : [categories[key]];
              });
              return updated;
            });
          }
        }
      } else {
        setExistingAnalysis(null);
      }
    } catch (error) {
      // No analysis yet
    }
  };

  const handleSave = async () => {
    try {
      if (analyseType === RootCauseMethod.CINQ_POURQUOI) {
        await rootCauseApi.addCinqPourquoi(selectedNC, pourquoiResponses);
      } else {
        await rootCauseApi.addIshikawa(selectedNC, ishikawaCategories);
      }
      message.success('Analyse des causes enregistrée');
      loadExistingAnalysis();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement de l\'analyse');
    }
  };

  const pourquoiQuestions = [
    'Pourquoi cette non-conformité s\'est-elle produite ?',
    'Pourquoi cela s\'est-il produit ?',
    'Pourquoi ?',
    'Pourquoi ?',
    'Cause racine identifiée',
  ];

  const ishikawaCategoryLabels: Record<RootCauseCategory, string> = {
    [RootCauseCategory.MACHINE]: 'Machine/Équipement',
    [RootCauseCategory.METHODE]: 'Méthode/Processus',
    [RootCauseCategory.MATERIAU]: 'Matériau',
    [RootCauseCategory.HOMME]: 'Homme/Personnel',
    [RootCauseCategory.ENVIRONNEMENT]: 'Environnement',
    [RootCauseCategory.MESURE]: 'Mesure',
  };

  if (loading) {
    return (
      <Layout title="Analyse des Causes" subtitle="Analyse des causes racines (5M, 8D)">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analyse des Causes" subtitle="Analyse des causes racines (5M, 8D)">
      <div className="root-cause-analysis-page">
        {error && (
          <Alert message="Erreur" description={error} type="error" showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Card style={{ marginBottom: 24 }}>
          <Form layout="vertical">
            <Form.Item label="Sélectionner une Non-Conformité">
              <Select
                value={selectedNC}
                onChange={setSelectedNC}
                placeholder="Sélectionner une NC"
                style={{ width: 300 }}
                allowClear
              >
                {ncs.map(nc => (
                  <Select.Option key={nc.id} value={nc.id}>
                    {nc.nc_number} - {nc.description.substring(0, 50)}...
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {selectedNC && (
              <Form.Item label="Méthode d'Analyse">
                <Select
                  value={analyseType}
                  onChange={setAnalyseType}
                  style={{ width: 300 }}
                >
                  <Select.Option value={RootCauseMethod.CINQ_POURQUOI}>
                    5 Pourquoi (5 Whys)
                  </Select.Option>
                  <Select.Option value={RootCauseMethod.ISHIKAWA}>
                    Ishikawa (Arête de poisson)
                  </Select.Option>
                </Select>
              </Form.Item>
            )}
          </Form>
        </Card>

        {selectedNC && (
          <Card>
            {analyseType === RootCauseMethod.CINQ_POURQUOI ? (
              <div>
                <h2>Analyse des 5 Pourquoi</h2>
                <Steps
                  direction="vertical"
                  current={pourquoiResponses.filter(r => r).length}
                  items={pourquoiQuestions.map((question, index) => ({
                    title: `Pourquoi ${index + 1}`,
                    description: (
                      <TextArea
                        value={pourquoiResponses[index]}
                        onChange={(e) => {
                          const newResponses = [...pourquoiResponses];
                          newResponses[index] = e.target.value;
                          setPourquoiResponses(newResponses);
                        }}
                        placeholder={question}
                        rows={2}
                        style={{ width: '100%', marginTop: 8 }}
                      />
                    ),
                  }))}
                />
              </div>
            ) : (
              <div>
                <h2>Diagramme d'Ishikawa (Arête de poisson)</h2>
                <List
                  bordered
                  dataSource={Object.entries(ishikawaCategoryLabels)}
                  renderItem={([key, label]) => (
                    <List.Item>
                      <Tag color="blue" style={{ width: 150 }}>{label}</Tag>
                      <TextArea
                        value={ishikawaCategories[key as RootCauseCategory]?.[0] || ''}
                        onChange={(e) => setIshikawaCategories(prev => ({
                          ...prev,
                          [key]: [e.target.value],
                        }))}
                        placeholder={`Entrez les causes pour ${label}`}
                        rows={2}
                        style={{ flex: 1 }}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            <Divider />

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={!selectedNC}
            >
              Enregistrer l'Analyse
            </Button>
          </Card>
        )}

        {existingAnalysis && (
          <Card style={{ marginTop: 24 }}>
            <h2>Analyse Actuelle</h2>
            <Tag color="blue">{existingAnalysis.method.toUpperCase()}</Tag>
            <p><strong>Cause Identifiée:</strong> {existingAnalysis.identified_cause || '-'}</p>
            <p><strong>Catégorie:</strong> {existingAnalysis.category || '-'}</p>
            <p><strong>Recommandations:</strong> {existingAnalysis.recommendations || '-'}</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RootCauseAnalysis;
