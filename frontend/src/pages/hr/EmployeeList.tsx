import { useState, useEffect, useCallback } from 'react';
import { employeeApi, departmentApi } from '../../services/hrApi';
import { Employee, EmployeeStatus, Department, CreateDepartmentDto } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveTab = 'employees' | 'departments';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusMeta: Record<EmployeeStatus, { label: string; color: string }> = {
  [EmployeeStatus.ACTIVE]:     { label: 'Actif',     color: '#16a34a' },
  [EmployeeStatus.INACTIVE]:   { label: 'Inactif',   color: '#6b7280' },
  [EmployeeStatus.TERMINATED]: { label: 'Résilié',   color: '#dc2626' },
  [EmployeeStatus.ON_LEAVE]:   { label: 'En congé',  color: '#d97706' },
};

const deptColors = [
  '#6366f1','#8b5cf6','#ec4899','#14b8a6','#f97316','#3b82f6','#84cc16','#eab308',
];

function deptColor(idx: number) {
  return deptColors[idx % deptColors.length];
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployeeList() {
  // ── Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('employees');

  // ── Employee state
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [empLoading, setEmpLoading]     = useState(true);
  const [empError, setEmpError]         = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deptFilter, setDeptFilter]     = useState<string>('');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  // ── Department state
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [deptLoading, setDeptLoading]   = useState(true);
  const [deptError, setDeptError]       = useState<string | null>(null);
  const [deptColorMap, setDeptColorMap] = useState<Record<string, string>>({});

  // ── Department modal
  const [showDeptModal, setShowDeptModal]   = useState(false);
  const [editingDept, setEditingDept]       = useState<Department | null>(null);
  const [deptForm, setDeptForm]             = useState<Partial<CreateDepartmentDto>>({});
  const [deptSaving, setDeptSaving]         = useState(false);

  // ── Employee modal (inline add)
  const [showEmpModal, setShowEmpModal]     = useState(false);
  const [empForm, setEmpForm]               = useState<Partial<{
    firstName: string; lastName: string; email: string;
    phone: string; departmentId: string; hireDate: string; status: EmployeeStatus;
  }>>({});
  const [empSaving, setEmpSaving]           = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Load departments (always needed for the dropdown + color map)
  // ─────────────────────────────────────────────────────────────────────────────
  const loadDepartments = useCallback(async () => {
    try {
      setDeptLoading(true);
      const data = await departmentApi.list();
      setDepartments(data);
      // Build color map
      const map: Record<string, string> = {};
      data.forEach((d, i) => { map[d.id] = deptColor(i); });
      setDeptColorMap(map);
    } catch {
      setDeptError('Impossible de charger les départements');
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Load employees
  // ─────────────────────────────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    try {
      setEmpLoading(true);
      setEmpError(null);
      const response = await employeeApi.list({
        page,
        limit: 15,
        search: search || undefined,
        status: (statusFilter as EmployeeStatus) || undefined,
        departmentId: deptFilter || undefined,
      });
      setEmployees(response.employees);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch {
      setEmpError('Impossible de charger les employés');
    } finally {
      setEmpLoading(false);
    }
  }, [page, statusFilter, deptFilter, search]);

  useEffect(() => { loadDepartments(); }, [loadDepartments]);
  useEffect(() => { if (activeTab === 'employees') loadEmployees(); }, [activeTab, loadEmployees]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Department CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const openNewDept = () => {
    setEditingDept(null);
    setDeptForm({});
    setShowDeptModal(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({ code: dept.code, name: dept.name, description: dept.description });
    setShowDeptModal(true);
  };

  const saveDept = async () => {
    if (!deptForm.name || !deptForm.code) return;
    try {
      setDeptSaving(true);
      if (editingDept) {
        await departmentApi.update(editingDept.id, deptForm);
      } else {
        await departmentApi.create(deptForm as CreateDepartmentDto);
      }
      setShowDeptModal(false);
      loadDepartments();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Erreur lors de l\'enregistrement';
      alert(msg);
    } finally {
      setDeptSaving(false);
    }
  };

  const deleteDept = async (id: string) => {
    if (!confirm('Supprimer ce département ?')) return;
    try {
      await departmentApi.delete(id);
      loadDepartments();
    } catch {
      alert('Échec de la suppression');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Employee quick-add
  // ─────────────────────────────────────────────────────────────────────────────
  const openNewEmp = () => {
    setEmpForm({});
    setShowEmpModal(true);
  };

  const saveEmployee = async () => {
    if (!empForm.firstName || !empForm.lastName || !empForm.email) return;
    try {
      setEmpSaving(true);
      await employeeApi.create({
        firstName: empForm.firstName,
        lastName: empForm.lastName,
        email: empForm.email,
        phone: empForm.phone,
        departmentId: empForm.departmentId,
        hireDate: empForm.hireDate,
        status: empForm.status ?? EmployeeStatus.ACTIVE,
      });
      setShowEmpModal(false);
      setPage(1);
      loadEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Erreur lors de la création';
      alert(msg);
    } finally {
      setEmpSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Search submit
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEmployees();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────────────────────────────────────
  const activeCount     = employees.filter(e => e.status === EmployeeStatus.ACTIVE).length;
  const onLeaveCount    = employees.filter(e => e.status === EmployeeStatus.ON_LEAVE).length;
  const terminatedCount = employees.filter(e => e.status === EmployeeStatus.TERMINATED).length;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Layout title="Gestion RH" subtitle="Employés & Départements">
      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div style={styles.tabBar}>
        {(['employees', 'departments'] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab ? styles.tabBtnActive : {}),
            }}
          >
            {tab === 'employees' ? (
              <><span style={styles.tabIcon}>👤</span> Employés</>
            ) : (
              <><span style={styles.tabIcon}>🏢</span> Départements</>
            )}
            {tab === 'employees' && (
              <span style={styles.tabBadge}>{total}</span>
            )}
            {tab === 'departments' && (
              <span style={styles.tabBadge}>{departments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB : EMPLOYEES
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'employees' && (
        <>
          {/* Stats row */}
          <div style={styles.statsGrid}>
            {[
              { label: 'Total Employés',  value: total,          color: '#3b82f6' },
              { label: 'Actifs',          value: activeCount,    color: '#16a34a' },
              { label: 'En congé',        value: onLeaveCount,   color: '#d97706' },
              { label: 'Résiliés',        value: terminatedCount,color: '#dc2626' },
              { label: 'Départements',    value: departments.length, color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={styles.statCard}>
                <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={styles.filterCard}>
            <form onSubmit={handleSearch} style={styles.filterForm}>
              <input
                type="text"
                placeholder="Rechercher par nom, email, matricule…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={styles.input}
              />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={styles.select}
              >
                <option value="">Tous les statuts</option>
                {Object.entries(statusMeta).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={deptFilter}
                onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                style={styles.select}
              >
                <option value="">Tous les départements</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button type="submit" style={styles.btnSearch}>🔍 Rechercher</button>
              <button type="button" onClick={openNewEmp} style={styles.btnPrimary}>
                + Nouvel Employé
              </button>
            </form>
          </div>

          {/* Table */}
          <div style={styles.tableWrap}>
            {empLoading ? (
              <div style={styles.emptyState}>Chargement…</div>
            ) : empError ? (
              <div style={{ ...styles.emptyState, color: '#dc2626' }}>{empError}</div>
            ) : employees.length === 0 ? (
              <div style={styles.emptyState}>Aucun employé trouvé.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Employé</th>
                    <th style={styles.th}>Département</th>
                    <th style={styles.th}>Date d'embauche</th>
                    <th style={styles.th}>Statut</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const dept = departments.find(d => d.id === emp.departmentId);
                    const color = dept ? deptColorMap[dept.id] ?? '#6b7280' : '#6b7280';
                    const sm = statusMeta[emp.status] ?? { label: emp.status, color: '#6b7280' };
                    return (
                      <tr key={emp.id} style={styles.tr}>
                        {/* Employee col */}
                        <td style={styles.td}>
                          <div style={styles.empCell}>
                            <div style={{ ...styles.avatar, background: color }}>
                              {initials(emp.firstName, emp.lastName)}
                            </div>
                            <div>
                              <div style={styles.empName}>{emp.firstName} {emp.lastName}</div>
                              <div style={styles.empEmail}>{emp.email}</div>
                              <div style={styles.empNum}>{emp.employeeNumber}</div>
                            </div>
                          </div>
                        </td>

                        {/* Department col – THE KEY ADDITION */}
                        <td style={styles.td}>
                          {dept ? (
                            <span style={{ ...styles.deptBadge, background: color + '22', color, borderColor: color + '44' }}>
                              <span style={{ ...styles.deptDot, background: color }} />
                              {dept.name}
                            </span>
                          ) : (
                            <span style={styles.noDept}>—</span>
                          )}
                        </td>

                        {/* Hire date */}
                        <td style={styles.td}>
                          <span style={styles.dateText}>
                            {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('fr-TN') : '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, background: sm.color + '22', color: sm.color }}>
                            {sm.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <button
                            onClick={() => window.location.href = `/hr/employees/${emp.id}`}
                            style={styles.actionBtn}
                          >
                            Voir
                          </button>
                          <button
                            onClick={() => window.location.href = `/hr/employees/${emp.id}/edit`}
                            style={{ ...styles.actionBtn, color: '#d97706' }}
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={styles.pageBtn}
              >
                ‹ Précédent
              </button>
              <span style={styles.pageInfo}>Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={styles.pageBtn}
              >
                Suivant ›
              </button>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB : DEPARTMENTS
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'departments' && (
        <>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>
              {departments.length} département{departments.length !== 1 ? 's' : ''}
            </span>
            <button onClick={openNewDept} style={styles.btnPrimary}>
              + Nouveau Département
            </button>
          </div>

          {deptLoading ? (
            <div style={styles.emptyState}>Chargement…</div>
          ) : deptError ? (
            <div style={{ ...styles.emptyState, color: '#dc2626' }}>{deptError}</div>
          ) : (
            <div style={styles.deptGrid}>
              {departments.map((dept, i) => {
                const color = deptColor(i);
                const empCount = dept.employeeCount ?? 0;
                return (
                  <div key={dept.id} style={{ ...styles.deptCard, borderTopColor: color }}>
                    <div style={styles.deptCardHeader}>
                      <div style={{ ...styles.deptIcon, background: color + '22', color }}>
                        🏢
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.deptName}>{dept.name}</div>
                        <div style={styles.deptCode}>{dept.code}</div>
                      </div>
                      <span style={{
                        ...styles.activeBadge,
                        background: dept.isActive ? '#dcfce7' : '#f3f4f6',
                        color: dept.isActive ? '#16a34a' : '#6b7280',
                      }}>
                        {dept.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    {dept.description && (
                      <p style={styles.deptDesc}>{dept.description}</p>
                    )}

                    <div style={styles.deptMeta}>
                      <div style={styles.deptMetaItem}>
                        <span style={styles.deptMetaIcon}>👥</span>
                        <span style={{ ...styles.deptMetaValue, color }}>
                          {empCount}
                        </span>
                        <span style={styles.deptMetaLabel}>employé{empCount !== 1 ? 's' : ''}</span>
                      </div>
                      {dept.managerName && (
                        <div style={styles.deptMetaItem}>
                          <span style={styles.deptMetaIcon}>👤</span>
                          <span style={styles.deptMetaLabel}>{dept.managerName}</span>
                        </div>
                      )}
                    </div>

                    {/* Employee mini-list for this dept */}
                    {(() => {
                      const deptEmps = employees.filter(e => e.departmentId === dept.id).slice(0, 4);
                      if (deptEmps.length === 0) return null;
                      return (
                        <div style={styles.deptEmpRow}>
                          {deptEmps.map(e => (
                            <div
                              key={e.id}
                              title={`${e.firstName} ${e.lastName}`}
                              style={{ ...styles.miniAvatar, background: color }}
                            >
                              {initials(e.firstName, e.lastName)}
                            </div>
                          ))}
                          {empCount > 4 && (
                            <div style={{ ...styles.miniAvatar, background: '#e5e7eb', color: '#6b7280' }}>
                              +{empCount - 4}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div style={styles.deptActions}>
                      <button onClick={() => openEditDept(dept)} style={styles.actionBtn}>
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteDept(dept.id)}
                        style={{ ...styles.actionBtn, color: '#dc2626' }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
              {departments.length === 0 && (
                <div style={{ ...styles.emptyState, gridColumn: '1/-1' }}>
                  Aucun département. Créez votre premier département.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL : Department form
      ════════════════════════════════════════════════════════════════════════ */}
      {showDeptModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDeptModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingDept ? 'Modifier le département' : 'Nouveau département'}
              </h2>
              <button onClick={() => setShowDeptModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.label}>Nom *</label>
              <input
                style={styles.input}
                value={deptForm.name ?? ''}
                onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ex: Ressources Humaines"
              />
              <label style={styles.label}>Code *</label>
              <input
                style={styles.input}
                value={deptForm.code ?? ''}
                onChange={e => setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="ex: RH"
              />
              <label style={styles.label}>Description</label>
              <textarea
                style={{ ...styles.input, height: 80, resize: 'vertical' }}
                value={deptForm.description ?? ''}
                onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description optionnelle…"
              />
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowDeptModal(false)} style={styles.btnCancel}>Annuler</button>
              <button onClick={saveDept} disabled={deptSaving} style={styles.btnPrimary}>
                {deptSaving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL : Employee quick-add
      ════════════════════════════════════════════════════════════════════════ */}
      {showEmpModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmpModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Nouvel employé</h2>
              <button onClick={() => setShowEmpModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Prénom *</label>
                  <input
                    style={styles.input}
                    value={empForm.firstName ?? ''}
                    onChange={e => setEmpForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Prénom"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Nom *</label>
                  <input
                    style={styles.input}
                    value={empForm.lastName ?? ''}
                    onChange={e => setEmpForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Nom de famille"
                  />
                </div>
              </div>
              <label style={styles.label}>Email *</label>
              <input
                style={styles.input}
                type="email"
                value={empForm.email ?? ''}
                onChange={e => setEmpForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemple.com"
              />
              <label style={styles.label}>Téléphone</label>
              <input
                style={styles.input}
                value={empForm.phone ?? ''}
                onChange={e => setEmpForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+216…"
              />
              <label style={styles.label}>Département</label>
              <select
                style={styles.select}
                value={empForm.departmentId ?? ''}
                onChange={e => setEmpForm(f => ({ ...f, departmentId: e.target.value || undefined }))}
              >
                <option value="">— Sélectionner un département —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Date d'embauche</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={empForm.hireDate ?? ''}
                    onChange={e => setEmpForm(f => ({ ...f, hireDate: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Statut</label>
                  <select
                    style={styles.select}
                    value={empForm.status ?? EmployeeStatus.ACTIVE}
                    onChange={e => setEmpForm(f => ({ ...f, status: e.target.value as EmployeeStatus }))}
                  >
                    {Object.entries(statusMeta).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowEmpModal(false)} style={styles.btnCancel}>Annuler</button>
              <button onClick={saveEmployee} disabled={empSaving} style={styles.btnPrimary}>
                {empSaving ? 'Création…' : 'Créer l\'employé'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  // Tab bar
  tabBar: {
    display: 'flex',
    gap: 4,
    borderBottom: '2px solid #e5e7eb',
    marginBottom: 24,
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    color: '#6b7280',
    background: 'transparent',
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    marginBottom: -2,
    cursor: 'pointer',
    borderRadius: '6px 6px 0 0',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    color: '#4f46e5',
    borderBottomColor: '#4f46e5',
    background: '#eef2ff',
  },
  tabIcon: { fontSize: 16 },
  tabBadge: {
    background: '#e5e7eb',
    color: '#374151',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 20,
    padding: '1px 7px',
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '16px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,.07)',
  },
  statValue: { fontSize: 26, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },

  // Filters
  filterCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '14px 18px',
    marginBottom: 18,
    boxShadow: '0 1px 4px rgba(0,0,0,.07)',
  },
  filterForm: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },

  // Table
  tableWrap: {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,.07)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9fafb' },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: { borderTop: '1px solid #f3f4f6', transition: 'background 0.15s' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },

  // Employee cell
  empCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
  },
  empName: { fontWeight: 600, fontSize: 14, color: '#111827' },
  empEmail: { fontSize: 12, color: '#6b7280' },
  empNum: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },

  // Department badge (in employee row)
  deptBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 600,
    border: '1px solid',
  },
  deptDot: {
    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
  },
  noDept: { color: '#9ca3af', fontSize: 13 },

  // Status badge
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },

  dateText: { fontSize: 13, color: '#374151' },

  // Pagination
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginTop: 20,
  },
  pageBtn: {
    padding: '8px 16px', borderRadius: 8,
    border: '1px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', fontSize: 13, color: '#374151',
  },
  pageInfo: { fontSize: 13, color: '#6b7280' },

  // Section header (departments tab)
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 15, color: '#374151', fontWeight: 600 },

  // Department grid
  deptGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 18,
  },
  deptCard: {
    background: '#fff',
    borderRadius: 12,
    borderTop: '4px solid',
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,.07)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  deptCardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  deptIcon: {
    width: 40, height: 40, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  },
  deptName: { fontWeight: 700, fontSize: 16, color: '#111827', lineHeight: 1.2 },
  deptCode: { fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', marginTop: 2 },
  activeBadge: {
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
  },
  deptDesc: { fontSize: 13, color: '#6b7280', margin: 0 },
  deptMeta: { display: 'flex', gap: 16 },
  deptMetaItem: { display: 'flex', alignItems: 'center', gap: 4 },
  deptMetaIcon: { fontSize: 14 },
  deptMetaValue: { fontSize: 18, fontWeight: 700 },
  deptMetaLabel: { fontSize: 12, color: '#6b7280' },

  // Employee mini-avatars in dept card
  deptEmpRow: { display: 'flex', gap: -8, flexWrap: 'nowrap' },
  miniAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    color: '#fff', fontWeight: 700, fontSize: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #fff', marginLeft: -4, flexShrink: 0,
  },

  deptActions: {
    display: 'flex', gap: 8, borderTop: '1px solid #f3f4f6',
    paddingTop: 10, marginTop: 'auto',
  },

  // Common
  emptyState: {
    padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14,
  },
  input: {
    width: '100%', padding: '9px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  select: {
    padding: '9px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 14, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#374151', marginBottom: 4, marginTop: 12,
  },
  formRow: { display: 'flex', gap: 12 },

  btnPrimary: {
    background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnCancel: {
    background: '#f3f4f6', color: '#374151',
    border: 'none', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  },
  btnSearch: {
    background: '#1f2937', color: '#fff',
    border: 'none', borderRadius: 8,
    padding: '9px 16px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  actionBtn: {
    background: 'transparent', border: 'none',
    color: '#4f46e5', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
  },

  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 16,
    width: '100%', maxWidth: 520,
    boxShadow: '0 20px 60px rgba(0,0,0,.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 },
  modalClose: {
    background: 'none', border: 'none', fontSize: 18,
    cursor: 'pointer', color: '#9ca3af',
  },
  modalBody: { padding: '4px 24px 8px' },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '16px 24px', borderTop: '1px solid #f3f4f6',
  },
};

export default EmployeeList;
