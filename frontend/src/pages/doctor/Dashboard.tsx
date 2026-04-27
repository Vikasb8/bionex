/**
 * Doctor Dashboard — Patient lookup, add records, profile setup.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/ui/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type { CSSProperties } from 'react';
import type { User, DoctorProfile, MedicalRecord, LabTest } from '../../types';

const dashGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', padding: '32px', maxWidth: '1200px', margin: '0 auto' };
const sectionTitle: CSSProperties = { fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-heading)' };
const testStatusStyle = (s: string): CSSProperties => {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    completed: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
    verified: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
    rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  };
  const c = colors[s] || colors.pending;
  return { display: 'inline-flex', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' };
};
const statusBadge = (verified: boolean): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: verified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: verified ? '#10b981' : '#f59e0b', border: `1px solid ${verified ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` });

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scannedIdInput, setScannedIdInput] = useState('');
  const [hospital, setHospital] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [license, setLicense] = useState('');
  const [searchId, setSearchId] = useState('');
  const [foundPatient, setFoundPatient] = useState<User | null>(null);
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [searchError, setSearchError] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Lab test state
  const [showPrescribeTest, setShowPrescribeTest] = useState(false);
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [prescribeLoading, setPrescribeLoading] = useState(false);
  const [prescribeError, setPrescribeError] = useState('');
  const [prescribedTests, setPrescribedTests] = useState<LabTest[]>([]);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTestForVerify, setSelectedTestForVerify] = useState<LabTest | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => { loadProfile(); loadPrescribedTests(); }, []);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 30, 
          qrbox: { width: 250, height: 250 }, 
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        },
        false
      );
      
      scanner.render((decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.type === 'emergency' && data.token) {
            scanner.clear();
            setShowScanner(false);
            navigate(`/emergency/${data.token}`);
            return;
          }
          setSearchId(data.health_id || decodedText);
        } catch (e) {
          setSearchId(decodedText);
        }
        scanner.clear();
        setShowScanner(false);
      }, undefined); // Ignore frequent parsing errors

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [showScanner]);

  const loadProfile = async () => {
    try { const { data } = await api.get('/admin/doctors/profile/'); setProfile(data); setHasProfile(true); } catch { setHasProfile(false); }
  };

  const handleCreateProfile = async () => {
    try { await api.post('/admin/doctors/profile/', { hospital_name: hospital, specialization, license_number: license }); loadProfile(); setShowProfileSetup(false); } catch {}
  };

  const handleSearchPatient = async () => {
    setSearchError(''); setFoundPatient(null); setPatientRecords([]);
    try { const { data } = await api.get(`/patient/${searchId}/`); setFoundPatient(data); loadPatientRecords(data.id); } catch { setSearchError('Patient not found'); }
  };

  const loadPatientRecords = async (patientId: string) => {
    try { const { data } = await api.get(`/records/${patientId}/`); setPatientRecords(Array.isArray(data) ? data : data.results || []); } catch {}
  };

  const handleAddRecord = async () => {
    if (!foundPatient) return;
    setAddError(''); setAddLoading(true);
    try {
      const formData = new FormData();
      formData.append('patient_id', foundPatient.id);
      formData.append('patient_type', 'user');
      formData.append('diagnosis', diagnosis);
      formData.append('prescription', prescription);
      formData.append('notes', notes);
      if (reportFiles.length > 0) {
        formData.append('report_file', reportFiles[0]);
      }
      await api.post('/records/add/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowAddRecord(false); setDiagnosis(''); setPrescription(''); setNotes(''); setReportFiles([]);
      loadPatientRecords(foundPatient.id);
    } catch { setAddError('Failed to add record. Are you verified?'); }
    finally { setAddLoading(false); }
  };

  const loadPrescribedTests = async () => {
    try { const { data } = await api.get('/labs/doctor-tests/'); setPrescribedTests(Array.isArray(data) ? data : data.results || []); } catch {}
  };

  const handlePrescribeTest = async () => {
    if (!foundPatient || !testName.trim()) return;
    setPrescribeLoading(true); setPrescribeError('');
    try {
      await api.post('/labs/prescribe/', {
        patient_id: foundPatient.id,
        patient_type: 'user',
        test_name: testName,
        test_description: testDescription,
      });
      setShowPrescribeTest(false); setTestName(''); setTestDescription('');
      loadPrescribedTests();
    } catch { setPrescribeError('Failed to prescribe test. Are you verified?'); }
    finally { setPrescribeLoading(false); }
  };

  const handleVerifyTest = async (action: 'verify' | 'reject') => {
    if (!selectedTestForVerify) return;
    setVerifyLoading(true);
    try {
      await api.post(`/labs/${selectedTestForVerify.id}/verify/`, { action, remarks: verifyRemarks });
      setShowVerifyModal(false); setVerifyRemarks('');
      loadPrescribedTests();
    } catch {}
    finally { setVerifyLoading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setReportFiles(Array.from(e.target.files));
  };

  return (
    <PageWrapper>
      <div style={{ position: 'relative', zIndex: 10, padding: '60px 32px 0', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Doctor Portal</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', marginBottom: '8px', fontWeight: 800, color: 'var(--text-heading)', zIndex: 10, position: 'relative' }}>Welcome, <span style={{ color: 'var(--primary)' }}>Dr. {user?.name || 'Doctor'}</span></h1>
        </motion.div>
      </div>
      <div style={dashGrid}>
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card hoverable style={{ height: '100%' }}>
            <div style={sectionTitle}>🏥 Medical License</div>
            {!hasProfile ? (
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Setup your verified doctor profile to enable EHR access.</p>
                <Button onClick={() => setShowProfileSetup(true)}>Begin Verification</Button>
              </div>
            ) : profile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-heading)' }}>Dr. {user?.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>{profile.specialization}</div>
                  </div>
                  <div style={statusBadge(profile.is_verified)}>
                    {profile.is_verified ? <><div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#10b981'}}/> Verified</> : <><div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#f59e0b'}}/> Pending</>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Hospital</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-heading)' }}>{profile.hospital_name}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>License</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace', color: 'var(--text-heading)' }}>{profile.license_number}</div>
                  </div>
                </div>
                {!profile.is_verified && <p style={{ fontSize: '13px', color: '#f59e0b', marginTop: '8px', background: 'rgba(245,158,11,0.1)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>Profile requires admin verification before EHR access is granted.</p>}
              </div>
            ) : null}
          </Card>
        </motion.div>

        {/* Patient Lookup */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card hoverable style={{ height: '100%' }}>
            <div style={sectionTitle}>🔍 Patient Lookup</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <Button 
                fullWidth 
                size="lg" 
                onClick={() => setShowScanner(true)} 
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 700 }}
              >
                <span style={{ fontSize: '22px' }}>📷</span> Scan Patient QR
              </Button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Input 
                  placeholder="Enter BIONEX UUID manually..." 
                  value={searchId} 
                  onChange={e => setSearchId(e.target.value)} 
                />
                <Button 
                  onClick={handleSearchPatient} 
                  variant="secondary" 
                  style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
                >
                  Search
                </Button>
              </div>
            </div>
            {searchError && <p style={{ fontSize: '14px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>{searchError}</p>}
            {foundPatient && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'color-mix(in srgb, var(--primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-heading)' }}>{foundPatient.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}><span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{foundPatient.unique_health_id}</span> • {foundPatient.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="md" onClick={() => setShowAddRecord(true)} style={{ boxShadow: '0 4px 20px -5px var(--primary-glow)' }}>+ Add Record</Button>
                    <Button size="md" variant="secondary" onClick={() => setShowPrescribeTest(true)} style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 20px -5px rgba(167,139,250,0.4)' }}>🧪 Prescribe Test</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Patient Medical History & Verified Lab Tests */}
        {foundPatient && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Historical Records */}
            <Card>
              <div style={sectionTitle}>📋 Medical History — {foundPatient.name}</div>
              {patientRecords.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '32px', borderRadius: '12px', textAlign: 'center' }}>No historical records found for this patient.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {patientRecords.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', transition: 'all 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-focus)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-light)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)' }}>{r.diagnosis}</span>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>{new Date(r.record_date).toLocaleDateString()}</span>
                      </div>
                      {r.prescription && <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>💊 {r.prescription}</div>}
                      {r.notes && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>📝 {r.notes}</div>}
                      {r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '13px', color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>📎 View Attachment</a>}
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* Verified Lab Results for this patient */}
            {(() => {
              const patientVerifiedTests = prescribedTests.filter(t => t.patient_id === foundPatient.id && t.status === 'verified');
              if (patientVerifiedTests.length === 0) return null;
              return (
                <Card>
                  <div style={sectionTitle}>✅ Verified Lab Results — {foundPatient.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {patientVerifiedTests.map((t, i) => (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)' }}>{t.test_name}</span>
                          <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>{new Date(t.verified_at || t.prescribed_at).toLocaleDateString()}</span>
                        </div>
                        {t.result && (
                          <div style={{ background: 'rgba(59,130,246,0.08)', padding: '12px', borderRadius: '10px', marginBottom: '8px', border: '1px solid rgba(59,130,246,0.15)' }}>
                            <div style={{ fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>Lab Result</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{t.result}</div>
                          </div>
                        )}
                        {t.doctor_remarks && (
                          <div style={{ background: 'rgba(16,185,129,0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.15)' }}>
                            <div style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>Your Remarks</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{t.doctor_remarks}</div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </Card>
              );
            })()}
          </motion.div>
        )}

        {/* Global Pending Lab Tests (Horizontal Scroll) */}
        {(() => {
          const pendingTests = prescribedTests.filter(t => t.status !== 'verified');
          if (pendingTests.length === 0) return null;
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ gridColumn: '1 / -1' }}>
              <Card>
                <div style={sectionTitle}>⏳ Pending & Awaiting Review Lab Tests</div>
                <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
                  {pendingTests.map((t, i) => {
                    const isCompleted = t.status === 'completed';
                    return (
                      <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => {
                          if (isCompleted) {
                            setSelectedTestForVerify(t); setVerifyRemarks(''); setShowVerifyModal(true);
                          }
                        }}
                        style={{ 
                          minWidth: '300px', flexShrink: 0, 
                          background: 'var(--bg-card)', border: '1px solid var(--border-light)', 
                          borderRadius: '16px', padding: '20px', 
                          cursor: isCompleted ? 'pointer' : 'default',
                          transition: 'all 0.3s ease' 
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = isCompleted ? 'rgba(59,130,246,0.5)' : 'var(--border-focus)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)' }}>{t.test_name}</span>
                          <span style={testStatusStyle(t.status)}>{t.status}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-heading)', marginBottom: '8px', fontWeight: 600 }}>👤 Patient: <span style={{ color: 'var(--primary)' }}>{t.patient_name || 'Unknown'}</span></div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Prescribed: {new Date(t.prescribed_at).toLocaleDateString()}</div>
                        
                        {isCompleted ? (
                          <div style={{ background: 'rgba(59,130,246,0.08)', padding: '12px', borderRadius: '10px', textAlign: 'center', color: '#3b82f6', fontWeight: 600, fontSize: '13px', border: '1px solid rgba(59,130,246,0.2)' }}>
                            Click to View Result & Approve
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(245,158,11,0.05)', padding: '12px', borderRadius: '10px', textAlign: 'center', color: '#f59e0b', fontSize: '12px', border: '1px dashed rgba(245,158,11,0.2)' }}>
                            Awaiting lab processing...
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          );
        })()}
      </div>

      {/* Create Profile Modal */}
      <Modal isOpen={showProfileSetup} onClose={() => setShowProfileSetup(false)} title="Doctor Profile Setup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Hospital Name" value={hospital} onChange={e => setHospital(e.target.value)} />
          <Input label="Specialization" value={specialization} onChange={e => setSpecialization(e.target.value)} />
          <Input label="License Number" value={license} onChange={e => setLicense(e.target.value)} />
          <Button fullWidth onClick={handleCreateProfile}>Submit for Verification</Button>
        </div>
      </Modal>

      {/* Add Record Modal */}
      <Modal isOpen={showAddRecord} onClose={() => setShowAddRecord(false)} title="Add Medical Record">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {addError && <p style={{ fontSize: '13px', color: '#ef4444' }}>{addError}</p>}
          <Input label="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
          <Input label="Prescription" value={prescription} onChange={e => setPrescription(e.target.value)} />
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          
          {/* File Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report / Photo</label>
            <label
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', border: '2px dashed var(--border-light)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', background: 'var(--bg-card)' }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-light)'; if (e.dataTransfer.files) setReportFiles(Array.from(e.dataTransfer.files)); }}
            >
              <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
              <span style={{ fontSize: '28px' }}>📄</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click or drag files here</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Images, PDF, DOC (max 20MB)</span>
            </label>
            {reportFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {reportFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--primary) 6%, transparent)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {f.type.startsWith('image/') ? '🖼️' : '📎'} {f.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button fullWidth onClick={handleAddRecord} loading={addLoading}>Add Record</Button>
        </div>
      </Modal>

      {/* Prescribe Test Modal */}
      <Modal isOpen={showPrescribeTest} onClose={() => setShowPrescribeTest(false)} title="Prescribe Lab Test">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {prescribeError && <p style={{ fontSize: '13px', color: '#ef4444' }}>{prescribeError}</p>}
          {foundPatient && (
            <div style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)', padding: '12px 16px', borderRadius: '12px', border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)' }}>
              <div style={{ fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>Patient</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>{foundPatient.name} — <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{foundPatient.unique_health_id}</span></div>
            </div>
          )}
          <Input label="Test Name" placeholder="e.g. CBC, X-Ray Chest, Lipid Panel" value={testName} onChange={e => setTestName(e.target.value)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description / Instructions</label>
            <textarea value={testDescription} onChange={e => setTestDescription(e.target.value)} placeholder="Special instructions for the lab..." rows={3}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-heading)', fontSize: '14px', fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <Button fullWidth onClick={handlePrescribeTest} loading={prescribeLoading} style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>Prescribe Test</Button>
        </div>
      </Modal>

      {/* Verify Test Modal */}
      <Modal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} title={`Verify: ${selectedTestForVerify?.test_name || ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedTestForVerify?.result && (
            <div style={{ background: 'rgba(59,130,246,0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 700 }}>Lab Result</div>
              <div style={{ fontSize: '14px', color: 'var(--text-heading)', whiteSpace: 'pre-wrap' }}>{selectedTestForVerify.result}</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Remarks</label>
            <textarea value={verifyRemarks} onChange={e => setVerifyRemarks(e.target.value)} placeholder="Optional remarks..." rows={3}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-heading)', fontSize: '14px', fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Button fullWidth onClick={() => handleVerifyTest('reject')} loading={verifyLoading} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>❌ Reject</Button>
            <Button fullWidth onClick={() => handleVerifyTest('verify')} loading={verifyLoading}>✅ Verify</Button>
          </div>
        </div>
      </Modal>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: 'var(--bg-card)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', borderRadius: '24px', padding: '40px 24px', width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 60px -10px var(--primary-glow)', textAlign: 'center' }}>
              <button onClick={() => setShowScanner(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--border-light)', border: 'none', color: 'var(--text-main)', fontSize: '18px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-heading)', marginTop: '10px' }}>Scan Patient QR</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>Position the patient's Bionex QR code within the frame to access records instantly.</p>
              
              <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto 24px', border: '2px solid color-mix(in srgb, var(--primary) 30%, transparent)', borderRadius: '16px', overflow: 'hidden', background: '#000' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                </div>
                <Input placeholder="Manually simulate scan with ID..." value={scannedIdInput} onChange={e => setScannedIdInput(e.target.value)} />
                <Button onClick={() => {
                  if (!scannedIdInput) return;
                  try {
                    const data = JSON.parse(scannedIdInput);
                    if (data.type === 'emergency' && data.token) {
                      setShowScanner(false);
                      navigate(`/emergency/${data.token}`);
                      return;
                    }
                    setSearchId(data.health_id || scannedIdInput);
                  } catch(e) {
                    setSearchId(scannedIdInput);
                  }
                  setShowScanner(false);
                }} style={{ width: '100%' }}>Simulate ID Capture</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
