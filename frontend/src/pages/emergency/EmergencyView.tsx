/**
 * Public Emergency View — accessible without authentication via token.
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageWrapper } from '../../components/ui/PageWrapper';
import { Card } from '../../components/ui/Card';
import axios from 'axios';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { CSSProperties } from 'react';
import type { PublicEmergencyData, MedicalRecord } from '../../types';

const containerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' };
const badgeStyle: CSSProperties = { display: 'inline-block', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '8px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' };
const fieldRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '14px' };
const labelStyle: CSSProperties = { color: 'var(--text-muted)', fontWeight: 500 };
const tagStyle: CSSProperties = { display: 'inline-block', background: 'rgba(0,229,255,0.1)', color: 'var(--primary)', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', margin: '2px 4px 2px 0' };
const timelineItem: CSSProperties = { position: 'relative', paddingLeft: '24px', paddingBottom: '20px', borderLeft: '2px dashed var(--border-light)' };
const timelineDot: CSSProperties = { position: 'absolute', left: '-7px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid rgba(10,16,30,1)' };
const sectionTitle: CSSProperties = { fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-heading)' };

export const EmergencyView = () => {
  const { user } = useAuthStore();
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicEmergencyData | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`/api/emergency/access/${token}/`)
        .then(res => {
          setData(res.data);
          // If the viewer is an authenticated doctor, also fetch the medical history
          if (user?.role === 'doctor' && res.data.patient_id) {
            api.get(`/records/${res.data.patient_id}/`)
              .then(recordsRes => setRecords(Array.isArray(recordsRes.data) ? recordsRes.data : recordsRes.data.results || []))
              .catch(console.error);
          }
        })
        .catch(() => setError('Invalid or expired emergency token'))
        .finally(() => setLoading(false));
    }
  }, [token, user]);

  if (loading) return (
    <PageWrapper>
      <div style={containerStyle}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    </PageWrapper>
  );

  if (error) return (
    <PageWrapper>
      <div style={containerStyle}>
        <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{error}</p>
        </Card>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <div style={containerStyle}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '480px', width: '100%' }}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={badgeStyle}>🚨 EMERGENCY ACCESS</div>
              <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>{data?.patient_name}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Critical medical information</p>
            </div>

            <div style={fieldRow}><span style={labelStyle}>Blood Group</span><span style={{ fontWeight: 700, color: '#ef4444', fontSize: '18px' }}>{data?.blood_group || 'Not specified'}</span></div>

            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={labelStyle}>Allergies</div>
              <div style={{ marginTop: '6px' }}>{data?.allergies?.length ? data.allergies.map((a, i) => <span key={i} style={{ ...tagStyle, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{a}</span>) : <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None listed</span>}</div>
            </div>

            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={labelStyle}>Chronic Conditions</div>
              <div style={{ marginTop: '6px' }}>{data?.chronic_conditions?.length ? data.chronic_conditions.map((c, i) => <span key={i} style={tagStyle}>{c}</span>) : <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None listed</span>}</div>
            </div>

            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={labelStyle}>Current Medications</div>
              <div style={{ marginTop: '6px' }}>{data?.current_medications?.length ? data.current_medications.map((m, i) => <span key={i} style={tagStyle}>{m}</span>) : <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None listed</span>}</div>
            </div>

            <div style={{ padding: '16px 0 0' }}>
              <div style={labelStyle}>Emergency Contact</div>
              <div style={{ marginTop: '6px', fontWeight: 500 }}>{data?.emergency_contact_name || 'Not provided'}</div>
              {data?.emergency_contact_phone && <div style={{ color: 'var(--primary)', fontSize: '14px' }}>📞 {data.emergency_contact_phone}</div>}
              {data?.emergency_contact_relation && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{data.emergency_contact_relation}</div>}
            </div>
          </Card>
          
          {/* If the viewer is a Doctor, show the Medical History */}
          {user?.role === 'doctor' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: '24px' }}>
              <Card>
                <div style={sectionTitle}>📋 Full Medical History</div>
                {records.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No historical records found for this patient.</p>
                ) : (
                  <div style={{ paddingTop: '10px' }}>
                    {records.map((r, i) => (
                      <div key={r.id} style={timelineItem}>
                        <div style={timelineDot} />
                        <div style={{ fontSize: '12px', color: 'var(--primary)', marginBottom: '4px', fontWeight: 600 }}>
                          {new Date(r.record_date).toLocaleDateString()}
                        </div>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{r.diagnosis}</div>
                          {r.prescription && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>💊 {r.prescription}</div>}
                          {r.notes && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>📝 {r.notes}</div>}
                          {r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--primary)' }}>📎 View Attachment</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
};
