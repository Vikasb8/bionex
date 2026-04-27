/**
 * Lab Department Dashboard — Search tests, submit results.
 */
import { useState, useEffect } from 'react';
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
import type { LabProfile, LabTest, User, DoctorProfile } from '../../types';

const dashGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', padding: '32px', maxWidth: '1200px', margin: '0 auto' };
const sectionTitle: CSSProperties = { fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-heading)' };
const statusBadge = (verified: boolean): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: verified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: verified ? '#10b981' : '#f59e0b', border: `1px solid ${verified ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` });

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

export const LabDashboard = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<LabProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [labName, setLabName] = useState('');
  const [department, setDepartment] = useState('');
  const [license, setLicense] = useState('');

  // Search state
  const [patientBionexId, setPatientBionexId] = useState('');
  const [doctorLicense, setDoctorLicense] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundPatient, setFoundPatient] = useState<User | null>(null);
  const [foundDoctor, setFoundDoctor] = useState<DoctorProfile | null>(null);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // Update result state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [resultText, setResultText] = useState('');
  const [resultFiles, setResultFiles] = useState<File[]>([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => { loadProfile(); }, []);

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
        let finalId = decodedText;
        try {
          const parsed = JSON.parse(decodedText);
          if (parsed.health_id) finalId = parsed.health_id;
        } catch {
          // Not JSON, fallback to raw text
        }
        setPatientBionexId(finalId);
        setShowScanner(false);
        scanner.clear();
        handleSearch(finalId);
      }, (err) => {
        console.warn("QR Code scanning failed", err);
      });

      return () => { scanner.clear().catch(console.error); };
    }
  }, [showScanner]);

  const loadProfile = async () => {
    try { const { data } = await api.get('/labs/profile/'); setProfile(data); setHasProfile(true); } catch { setHasProfile(false); }
  };

  const handleCreateProfile = async () => {
    try {
      await api.post('/labs/profile/', { lab_name: labName, department, license_number: license });
      loadProfile(); setShowProfileSetup(false);
    } catch {}
  };

  const handleSearch = async (scannedId?: string) => {
    setSearchError(''); setFoundPatient(null); setFoundDoctor(null); setTests([]);
    const idToSearch = scannedId || patientBionexId.trim();
    if (!idToSearch) {
      setSearchError('Patient Bionex ID is required');
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await api.get('/labs/search/', {
        params: { patient_health_id: idToSearch, doctor_license: doctorLicense.trim() }
      });
      setFoundPatient(data.patient);
      setFoundDoctor(data.doctor || null);
      setTests(data.tests);
      if (data.tests.length === 0) setSearchError('No tests found for this patient');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setSearchError(axiosError.response?.data?.error || 'Search failed');
    } finally { setSearchLoading(false); }
  };

  const handleOpenUpdate = (test: LabTest) => {
    setSelectedTest(test); setResultText(''); setResultFiles([]); setUpdateError(''); setShowUpdateModal(true);
  };

  const handleSubmitResult = async () => {
    if (!selectedTest || !resultText.trim()) { setUpdateError('Result text is required'); return; }
    setUpdateLoading(true); setUpdateError('');
    try {
      const formData = new FormData();
      formData.append('result', resultText);
      if (resultFiles.length > 0) formData.append('result_file', resultFiles[0]);
      await api.patch(`/labs/${selectedTest.id}/result/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowUpdateModal(false);
      // Refresh search
      handleSearch();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setUpdateError(axiosError.response?.data?.error || 'Failed to submit result');
    } finally { setUpdateLoading(false); }
  };

  return (
    <PageWrapper>
      <div style={{ position: 'relative', zIndex: 10, padding: '60px 32px 0', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Lab Portal</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', marginBottom: '8px', fontWeight: 800, color: 'var(--text-heading)' }}>Welcome, <span style={{ color: '#a78bfa' }}>{user?.name || 'Lab Technician'}</span></h1>
        </motion.div>
      </div>

      <div style={dashGrid}>
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card hoverable style={{ height: '100%' }}>
            <div style={sectionTitle}>🔬 Lab Profile</div>
            {!hasProfile ? (
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Setup your lab profile to start processing test results.</p>
                <Button onClick={() => setShowProfileSetup(true)}>Create Lab Profile</Button>
              </div>
            ) : profile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-heading)' }}>{user?.name}</div>
                    <div style={{ fontSize: '13px', color: '#a78bfa', marginTop: '4px', fontWeight: 600 }}>{profile.department}</div>
                  </div>
                  <div style={statusBadge(profile.is_verified)}>
                    {profile.is_verified ? <><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> Verified</> : <><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} /> Pending</>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Lab Name</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-heading)' }}>{profile.lab_name}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>License</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace', color: 'var(--text-heading)' }}>{profile.license_number}</div>
                  </div>
                </div>
                {!profile.is_verified && <p style={{ fontSize: '13px', color: '#f59e0b', marginTop: '8px', background: 'rgba(245,158,11,0.1)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>Profile requires admin verification before you can process lab results.</p>}
              </div>
            ) : null}
          </Card>
        </motion.div>

        {/* Search Tests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card hoverable style={{ height: '100%' }}>
            <div style={sectionTitle}>🔍 Find Prescribed Tests</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                <Input label="Patient Bionex ID" placeholder="e.g. MID-1234-ABCD" value={patientBionexId} onChange={e => setPatientBionexId(e.target.value)} />
                <Button variant="secondary" onClick={() => setShowScanner(true)} style={{ height: '42px', padding: '0 16px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>📷 Scan</Button>
              </div>
              <Input label="Doctor License Number (Optional)" placeholder="Filter by prescribing doctor" value={doctorLicense} onChange={e => setDoctorLicense(e.target.value)} />
              <Button fullWidth onClick={() => handleSearch()} loading={searchLoading} style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', boxShadow: '0 4px 20px -5px rgba(167,139,250,0.4)' }}>
                🔍 Search Tests
              </Button>
            </div>
            {searchError && <p style={{ fontSize: '14px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', marginTop: '16px' }}>{searchError}</p>}
          </Card>
        </motion.div>

        {/* Search Results */}
        {foundPatient && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ gridColumn: '1 / -1' }}>
            <Card>
              {/* Patient & Doctor Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.05), transparent)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 700 }}>Patient</div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-heading)' }}>{foundPatient.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}><span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{foundPatient.unique_health_id}</span> • {foundPatient.email}</div>
                </div>
                {foundDoctor && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.05), transparent)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 700 }}>Prescribing Doctor Filter</div>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-heading)' }}>Dr. {foundDoctor.user_details?.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{foundDoctor.specialization} • <span style={{ fontFamily: 'monospace' }}>{foundDoctor.license_number}</span></div>
                  </div>
                )}
              </div>

              <div style={sectionTitle}>🧪 Prescribed Tests ({tests.length})</div>
              {tests.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '32px', borderRadius: '12px', textAlign: 'center' }}>No tests found.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {tests.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', transition: 'all 0.3s ease' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)' }}>{t.test_name}</span>
                        <span style={testStatusStyle(t.status)}>{t.status}</span>
                      </div>
                      {t.test_description && <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>📋 {t.test_description}</div>}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Prescribed: {new Date(t.prescribed_at).toLocaleDateString()}</div>
                      {!foundDoctor && t.doctor_details && (
                        <div style={{ background: 'rgba(167,139,250,0.05)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(167,139,250,0.1)' }}>
                          <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', fontWeight: 700 }}>Prescribing Doctor</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-heading)', fontWeight: 600 }}>Dr. {t.doctor_details.user_details?.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.doctor_details.specialization} • {t.doctor_details.license_number}</div>
                        </div>
                      )}
                      {t.result && (
                        <div style={{ background: 'rgba(59,130,246,0.08)', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid rgba(59,130,246,0.15)' }}>
                          <div style={{ fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>Result</div>
                          <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{t.result}</div>
                        </div>
                      )}
                      {t.doctor_remarks && (
                        <div style={{ background: 'rgba(16,185,129,0.08)', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <div style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>Doctor Remarks</div>
                          <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{t.doctor_remarks}</div>
                        </div>
                      )}
                      {t.status === 'pending' && (
                        <Button fullWidth size="md" onClick={() => handleOpenUpdate(t)} style={{ marginTop: '8px', background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>
                          📝 Submit Result
                        </Button>
                      )}
                      {t.result_file_url && <a href={t.result_file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '13px', color: '#a78bfa', background: 'rgba(167,139,250,0.08)', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(167,139,250,0.2)' }}>📎 View Attachment</a>}
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Create Profile Modal */}
      <Modal isOpen={showProfileSetup} onClose={() => setShowProfileSetup(false)} title="Lab Profile Setup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Lab / Hospital Name" value={labName} onChange={e => setLabName(e.target.value)} />
          <Input label="Department" placeholder="e.g. Pathology, Radiology" value={department} onChange={e => setDepartment(e.target.value)} />
          <Input label="License Number" value={license} onChange={e => setLicense(e.target.value)} />
          <Button fullWidth onClick={handleCreateProfile}>Submit for Verification</Button>
        </div>
      </Modal>

      {/* Update Result Modal */}
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title={`Submit Result — ${selectedTest?.test_name || ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {updateError && <p style={{ fontSize: '13px', color: '#ef4444' }}>{updateError}</p>}
          {selectedTest?.test_description && (
            <div style={{ background: 'rgba(167,139,250,0.08)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(167,139,250,0.15)' }}>
              <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>Doctor Instructions</div>
              <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{selectedTest.test_description}</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Test Result</label>
            <textarea value={resultText} onChange={e => setResultText(e.target.value)} placeholder="Enter detailed test results..." rows={5}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-heading)', fontSize: '14px', fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attach Report (Optional)</label>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', border: '2px dashed var(--border-light)', borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-card)' }}>
              <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => { if (e.target.files) setResultFiles(Array.from(e.target.files)); }} style={{ display: 'none' }} />
              <span style={{ fontSize: '28px' }}>📄</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click or drag files here</span>
            </label>
            {resultFiles.length > 0 && resultFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(167,139,250,0.06)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
                <span>📎 {f.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{(f.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
          </div>
          <Button fullWidth onClick={handleSubmitResult} loading={updateLoading} style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>Submit Result</Button>
        </div>
      </Modal>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowScanner(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-light)', boxShadow: '0 20px 40px var(--shadow-glass)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Scan Patient QR</h3>
                <button onClick={() => setShowScanner(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
              <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
