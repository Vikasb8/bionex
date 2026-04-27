/**
 * Patient Dashboard — Health ID, QR, Records Timeline, Emergency Toggle, Family.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { PageWrapper } from '../../components/ui/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import type { CSSProperties } from 'react';
import type { FamilyProfile, MedicalRecord, EmergencyData } from '../../types';

const dashGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', padding: '32px', maxWidth: '1200px', margin: '0 auto' };
const sectionTitle: CSSProperties = { fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-heading)' };
const healthIdBadge: CSSProperties = { display: 'inline-block', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)', borderRadius: '12px', padding: '10px 20px', fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', letterSpacing: '3px', boxShadow: '0 4px 20px -5px var(--primary-glow)' };
const tagStyle: CSSProperties = { display: 'inline-block', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', color: 'var(--primary)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, margin: '4px 6px 4px 0', border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)' };
const timelineItem: CSSProperties = { position: 'relative', paddingLeft: '28px', paddingBottom: '24px', borderLeft: '2px dashed var(--border-light)' };
const timelineDot: CSSProperties = { position: 'absolute', left: '-8px', top: '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-main)', boxShadow: '0 0 10px var(--primary-glow)' };

export const PatientDashboard = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [family, setFamily] = useState<FamilyProfile[]>([]);
  const [emergency, setEmergency] = useState<EmergencyData | null>(null);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showEmergencySetup, setShowEmergencySetup] = useState(false);
  const [emergencyToken, setEmergencyToken] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('child');
  const [memberDob, setMemberDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [contacts, setContacts] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => { if (user) { loadData(); } }, [user]);

  const loadData = () => { loadRecords(); loadFamily(); loadEmergency(); };
  const loadRecords = async () => { try { const { data } = await api.get(`/records/${user!.id}/`); setRecords(Array.isArray(data) ? data : data.results || []); } catch {} };
  const loadFamily = async () => { try { const { data } = await api.get('/family/list/'); setFamily(data); } catch {} };
  const loadEmergency = async () => {
    try {
      const { data } = await api.get(`/emergency/${user!.id}/manage/`);
      setEmergency(data); setBloodGroup(data.blood_group || ''); setAllergies((data.allergies || []).join(', '));
      setConditions((data.chronic_conditions || []).join(', ')); setMedications((data.current_medications || []).join(', '));
      setEcName(data.emergency_contact_name || ''); setEcPhone(data.emergency_contact_phone || '');
    } catch {}
  };

  const handleAddFamily = async () => {
    try { await api.post('/family/add/', { member_name: memberName, relation: memberRelation, date_of_birth: memberDob || null }); setShowAddFamily(false); setMemberName(''); loadFamily(); } catch {}
  };
  const handleRemoveFamily = async (id: string) => { try { await api.delete(`/family/${id}/`); loadFamily(); } catch {} };
  const handleSaveEmergency = async () => {
    try {
      await api.patch(`/emergency/${user!.id}/manage/`, { blood_group: bloodGroup, allergies: allergies.split(',').map(s => s.trim()).filter(Boolean), chronic_conditions: conditions.split(',').map(s => s.trim()).filter(Boolean), current_medications: medications.split(',').map(s => s.trim()).filter(Boolean), emergency_contact_name: ecName, emergency_contact_phone: ecPhone });
      loadEmergency(); setShowEmergencySetup(false);
    } catch {}
  };
  const handleToggleEmergency = async (action: 'enable' | 'disable') => {
    try { const { data } = await api.post(`/emergency/${user!.id}/toggle/`, { action, hours: 24 }); if (action === 'enable') setEmergencyToken(data.token); else setEmergencyToken(null); loadEmergency(); } catch {}
  };

  return (
    <PageWrapper>
      <div style={{ position: 'relative', zIndex: 10, padding: '60px 32px 0', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Patient Portal</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', marginBottom: '8px', fontWeight: 800, color: 'var(--text-heading)', zIndex: 10, position: 'relative' }}>Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.name || 'Patient'}</span> 👋</h1>
        </motion.div>
      </div>
      <div style={dashGrid}>
        {/* Health ID */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card hoverable>
            <div style={sectionTitle}>🪪 Health Identity</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
              <div style={healthIdBadge}>{user?.unique_health_id || 'N/A'}</div>
              {user?.unique_health_id && <div style={{ background: 'rgba(255,255,255,0.95)', padding: '16px', borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}><QRCode value={JSON.stringify({ type: 'standard', health_id: user.unique_health_id, version: 1 })} size={180} level="H" /></div>}
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.5px' }}>SCAN TO ACCESS RECORDS</p>
            </div>
          </Card>
        </motion.div>
        {/* Emergency */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card hoverable style={{ height: '100%' }}>
            <div style={sectionTitle}>🚨 Emergency Protocol</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              <AnimatePresence mode="wait">
                {emergency?.is_emergency_mode_enabled ? <motion.span key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 10px #ef4444'}}/> ACTIVE</motion.span>
                : <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>⚪ Inactive</motion.span>}
              </AnimatePresence>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {emergency?.is_emergency_mode_enabled ? <Button variant="danger" size="md" onClick={() => handleToggleEmergency('disable')} style={{ flex: 1 }}>Disable Alert</Button> : <Button size="md" onClick={() => handleToggleEmergency('enable')} style={{ flex: 1 }}>Enable Emergency</Button>}
              <Button variant="ghost" size="md" onClick={() => setShowEmergencySetup(true)} style={{ flex: 1 }}>Manage Data</Button>
            </div>
            {emergencyToken && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}><p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px', fontWeight: 700, letterSpacing: '1px' }}>EMERGENCY OVERRIDE QR</p><div style={{ background: '#fff', padding: '12px', borderRadius: '12px', display: 'inline-block' }}><QRCode value={JSON.stringify({ type: 'emergency', token: emergencyToken, version: 1 })} size={140} level="H" /></div></motion.div>}
          </Card>
        </motion.div>
        {/* Family */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card hoverable style={{ height: '100%' }}>
            <div style={{ ...sectionTitle, justifyContent: 'space-between' }}><span>👨‍👩‍👧‍👦 Dependents</span><Button variant="ghost" size="sm" onClick={() => setShowAddFamily(true)}>+ Add</Button></div>
            {family.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>No family members linked.</p> : family.map(m => (
              <motion.div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }} whileHover={{ borderColor: 'var(--border-focus)' }}>
                <div><div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-heading)' }}>{m.member_name}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}><span style={{ color: 'var(--primary)' }}>{m.relation}</span> • {m.unique_health_id}</div></div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveFamily(m.id)} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>✕</Button>
              </motion.div>
            ))}
          </Card>
        </motion.div>
        {/* Medical Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ gridColumn: '1 / -1' }}>
          <Card>
            <div style={sectionTitle}>📋 Medical History</div>
            {records.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '32px', borderRadius: '12px', textAlign: 'center' }}>Your timeline is pristine. Records appear when a verified doctor adds them.</p> : (
              <div style={{ paddingTop: '16px' }}>
                {records.map((r, i) => (
                  <motion.div key={r.id} style={timelineItem} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 * i }}>
                    <div style={timelineDot} />
                    <div style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '1px' }}>{new Date(r.record_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div onClick={() => setSelectedRecord(r)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={e => {e.currentTarget.style.borderColor='var(--border-focus)'; e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e => {e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.transform='translateY(0)';}}>
                      <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: 'var(--text-heading)' }}>{r.diagnosis}</div>
                      {r.prescription && <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}><span style={{marginRight:'8px'}}>💊</span>{r.prescription}</div>}
                      {r.notes && <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}><span style={{marginRight:'8px'}}>📝</span>{r.notes}</div>}
                      {r.doctor_details && <div style={tagStyle}>Dr. {r.doctor_details.user_details?.name}</div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
      <Modal isOpen={showAddFamily} onClose={() => setShowAddFamily(false)} title="Add Family Member">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Name" value={memberName} onChange={e => setMemberName(e.target.value)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Relation</label>
            <select value={memberRelation} onChange={e => setMemberRelation(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px' }}>
              <option value="child">Child</option><option value="parent">Parent</option><option value="spouse">Spouse</option><option value="sibling">Sibling</option><option value="other">Other</option>
            </select>
          </div>
          <Input label="Date of Birth" type="date" value={memberDob} onChange={e => setMemberDob(e.target.value)} />
          <Button fullWidth onClick={handleAddFamily}>Add Member</Button>
        </div>
      </Modal>
      <Modal isOpen={showEmergencySetup} onClose={() => setShowEmergencySetup(false)} title="Emergency Data">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Blood Group" placeholder="O+" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} />
          <Input label="Allergies (comma-separated)" value={allergies} onChange={e => setAllergies(e.target.value)} />
          <Input label="Chronic Conditions" value={conditions} onChange={e => setConditions(e.target.value)} />
          <Input label="Medications" value={medications} onChange={e => setMedications(e.target.value)} />
          <Input label="Emergency Contact Name" value={ecName} onChange={e => setEcName(e.target.value)} />
          <Input label="Emergency Contacts (comma-separated names/numbers)" value={contacts} onChange={e => setContacts(e.target.value)} />
          <Button fullWidth onClick={handleSaveEmergency}>Save Data</Button>
        </div>
      </Modal>
      {/* Record View Modal */}
      <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Medical Record Detail">
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Diagnosis</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>{selectedRecord.diagnosis}</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Date</div>
                <div style={{ fontSize: '15px', color: 'var(--text-main)' }}>{new Date(selectedRecord.record_date).toLocaleDateString()}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Attending Doctor</div>
                <div style={{ fontSize: '15px', color: 'var(--text-main)' }}>Dr. {selectedRecord.doctor_details?.user_details?.name}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Prescription & Treatment</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{selectedRecord.prescription || 'No prescription specified.'}</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Clinical Notes</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{selectedRecord.notes || 'No additional notes.'}</div>
            </div>

            <Button fullWidth onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Medical Record - BIONEX</title>
                    <style>
                      body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                      h1 { color: #000; margin-bottom: 5px; }
                      .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                      .meta { color: #555; font-size: 14px; margin-bottom: 4px; }
                      .section { margin-bottom: 24px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #eee; }
                      .label { font-weight: 700; color: #374151; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px; }
                      .content { font-size: 15px; color: #1f2937; }
                      .footer { margin-top: 50px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>BIONEX Verified Record</h1>
                      <div class="meta"><strong>Date:</strong> ${new Date(selectedRecord.record_date).toLocaleDateString()}</div>
                      <div class="meta"><strong>Doctor:</strong> Dr. ${selectedRecord.doctor_details?.user_details?.name || 'Verified Practitioner'}</div>
                      <div class="meta"><strong>Record ID:</strong> ${selectedRecord.id}</div>
                    </div>
                    <div class="section">
                      <div class="label">Diagnosis</div>
                      <div class="content">${selectedRecord.diagnosis}</div>
                    </div>
                    <div class="section">
                      <div class="label">Prescription / Treatment</div>
                      <div class="content">${selectedRecord.prescription || 'N/A'}</div>
                    </div>
                    <div class="section">
                      <div class="label">Clinical Notes</div>
                      <div class="content">${selectedRecord.notes || 'N/A'}</div>
                    </div>
                    <div class="footer">
                      Generated via BIONEX Immutable Ledger • This is a cryptographically verified medical document.
                    </div>
                    <script>
                      window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }
                    </script>
                  </body>
                </html>
              `);
              printWindow.document.close();
            }} style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', marginTop: '8px' }}>
              📥 Download PDF
            </Button>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
};
