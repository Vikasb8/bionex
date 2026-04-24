/**
 * Admin Dashboard — Verify doctors, view audit logs.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageWrapper } from '../../components/ui/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';
import type { CSSProperties } from 'react';
import type { DoctorProfile, AccessLog } from '../../types';

const dashGrid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', padding: '32px', maxWidth: '1200px', margin: '0 auto' };
const sectionTitle: CSSProperties = { fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-heading)' };
const tableRow: CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr auto', gap: '16px', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', transition: 'background 0.2s' };
const tableHeader: CSSProperties = { ...tableRow, fontWeight: 700, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' };

export const AdminDashboard = () => {
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [tab, setTab] = useState<'doctors' | 'logs'>('doctors');

  useEffect(() => { loadPending(); loadLogs(); }, []);

  const loadPending = async () => { try { const { data } = await api.get('/admin/doctors/pending/'); setPendingDoctors(data); } catch {} };
  const loadLogs = async () => { try { const { data } = await api.get('/audit/logs/'); setLogs(data); } catch {} };

  const handleVerify = async (id: string) => {
    try { await api.post(`/admin/doctors/${id}/verify/`); loadPending(); } catch {}
  };

  const tabBtnStyle = (active: boolean): CSSProperties => ({
    padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(0,229,255,0.1)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-muted)',
    border: active ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent', fontFamily: 'var(--font-sans)',
    transition: 'all 0.2s ease',
  });

  return (
    <PageWrapper>
      <div style={{ position: 'relative', zIndex: 10, padding: '60px 32px 0', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Security & Control</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', marginBottom: '8px', fontWeight: 800 }}>Admin Portal 🛡️</h1>
        </motion.div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(10,16,30,0.8)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button style={tabBtnStyle(tab === 'doctors')} onClick={() => setTab('doctors')}>Verification Queue ({pendingDoctors.length})</button>
          <button style={tabBtnStyle(tab === 'logs')} onClick={() => setTab('logs')}>System Audit Logs</button>
        </div>
      </div>
      <div style={dashGrid}>
        {tab === 'doctors' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ ...sectionTitle, padding: '28px 28px 16px', margin: 0 }}>👨‍⚕️ Verification Queue</div>
              {pendingDoctors.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '0 28px 28px' }}>No pending verifications at the moment.</p> : (
                <div>
                  <div style={tableHeader}><span>Doctor Name</span><span>Hospital</span><span>Specialization</span><span>License ID</span><span>Action</span></div>
                  {pendingDoctors.map(d => (
                    <motion.div key={d.id} style={tableRow} whileHover={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{d.user_details?.name || 'N/A'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{d.hospital_name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{d.specialization}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>{d.license_number}</span>
                      <Button size="sm" onClick={() => handleVerify(d.id)} style={{ boxShadow: '0 4px 12px -4px rgba(0,229,255,0.4)' }}>✓ Verify</Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
        {tab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ ...sectionTitle, padding: '28px 28px 16px', margin: 0 }}>📊 Immutable Access Logs</div>
              {logs.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '0 28px 28px' }}>No system logs yet.</p> : (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {logs.map(log => (
                    <motion.div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }} whileHover={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{log.action}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Actor: <span style={{ color: 'var(--primary)' }}>{log.actor_name}</span> ({log.actor_role})</span>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};
