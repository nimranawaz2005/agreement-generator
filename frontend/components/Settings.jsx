import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Unified State for All Settings
  const [settings, setSettings] = useState({
    // Feature 1: Company Profile
    companyName: '',
    signatoryName: '',
    signatoryTitle: '',
    email: '',
    logoUrl: '',

    // Feature 2: Email & Document Preferences
    defaultSubject: 'Document: {document_title}',
    emailTemplate: 'Hello {client_name},\n\nPlease review and find attached your agreement.\n\nBest regards,\n{company_name}',
    currency: 'USD ($)',
    defaultTaxRate: 0,
    paymentTermsDays: 14,
  });

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('app_settings');
    if (savedData) {
      setSettings(JSON.parse(savedData));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '24px', backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '16px' }}>⚙️ Platform Settings</h2>

      {saved && (
        <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#166534', color: '#4ade80', borderRadius: '6px', fontSize: '0.9rem' }}>
          ✅ Settings saved successfully!
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '24px', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 16px',
            backgroundColor: activeTab === 'profile' ? '#2563eb' : 'transparent',
            color: activeTab === 'profile' ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🏢 Company Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          style={{
            padding: '10px 16px',
            backgroundColor: activeTab === 'email' ? '#2563eb' : 'transparent',
            color: activeTab === 'email' ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ✉️ Email Defaults
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('document')}
          style={{
            padding: '10px 16px',
            backgroundColor: activeTab === 'document' ? '#2563eb' : 'transparent',
            color: activeTab === 'document' ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📄 Document Preferences
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* TAB 1: COMPANY PROFILE */}
        {activeTab === 'profile' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Company Name</label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Solutions Inc."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Default Signatory Name</label>
                <input
                  type="text"
                  name="signatoryName"
                  value={settings.signatoryName}
                  onChange={handleChange}
                  placeholder="e.g. Nimra Nawaz"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Signatory Title</label>
                <input
                  type="text"
                  name="signatoryTitle"
                  value={settings.signatoryTitle}
                  onChange={handleChange}
                  placeholder="e.g. CEO / Lead Developer"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Official Contact Email</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Company Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
              {settings.logoUrl && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Logo Preview:</p>
                  <img src={settings.logoUrl} alt="Company Logo" style={{ maxHeight: '60px', borderRadius: '4px', border: '1px solid #475569', padding: '4px', backgroundColor: '#fff' }} />
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: EMAIL PREFERENCES */}
        {activeTab === 'email' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Default Email Subject Line</label>
              <input
                type="text"
                name="defaultSubject"
                value={settings.defaultSubject}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Default Email Body Text</label>
              <textarea
                name="emailTemplate"
                rows="5"
                value={settings.emailTemplate}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'monospace' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                Available placeholders: <code>{"{client_name}"}</code>, <code>{"{document_title}"}</code>, <code>{"{company_name}"}</code>
              </p>
            </div>
          </>
        )}

        {/* TAB 3: DOCUMENT PREFERENCES */}
        {activeTab === 'document' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Currency</label>
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                  <option value="PKR (Rs)">PKR (Rs)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Default Tax Rate (%)</label>
                <input
                  type="number"
                  name="defaultTaxRate"
                  value={settings.defaultTaxRate}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Payment Terms (Days)</label>
                <input
                  type="number"
                  name="paymentTermsDays"
                  value={settings.paymentTermsDays}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                />
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <button
          type="submit"
          style={{ marginTop: '16px', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Save All Settings
        </button>
      </form>
    </div>
  );
};

export default Settings;  