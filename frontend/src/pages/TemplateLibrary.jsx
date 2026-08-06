import React from 'react';
import { useNavigate } from 'react-router-dom';

const TEMPLATES = [
  {
    id: 'software-dev',
    title: 'Software Development Agreement',
    category: 'Engineering',
    description: 'Complete project contract including milestone breakdown, code ownership terms, and maintenance options.',
    defaultData: {
      title: 'Software Development Agreement',
      projectScope: 'Design, develop, test, and deploy a custom web application tailored to client requirements.',
      items: [
        { description: 'Frontend & Backend Core Development', cost: 5000 },
        { description: 'Database Setup & API Integration', cost: 2500 },
        { description: 'Deployment & Quality Assurance', cost: 1000 }
      ]
    }
  },
  {
    id: 'design-proposal',
    title: 'Brand & Graphic Design Proposal',
    category: 'Design',
    description: 'Comprehensive branding proposal covering identity design, logo assets, UI kit, and brand guidelines.',
    defaultData: {
      title: 'Brand Design Proposal',
      projectScope: 'Create full brand identity including logo variations, color palettes, typography, and social media assets.',
      items: [
        { description: 'Logo Design & Visual Identity', cost: 1500 },
        { description: 'Brand Style Guide & Assets Package', cost: 800 }
      ]
    }
  },
  {
    id: 'monthly-retainer',
    title: 'Monthly Maintenance Retainer',
    category: 'Support',
    description: 'Standard ongoing service agreement for monthly code maintenance, server monitoring, and priority support.',
    defaultData: {
      title: 'Monthly Service Retainer',
      projectScope: 'Ongoing technical maintenance, security patches, monthly database backups, and up to 15 hours of on-demand technical support.',
      items: [
        { description: 'Monthly System Maintenance & Backups', cost: 800 },
        { description: '15 Dedicated Support Hours', cost: 1200 }
      ]
    }
  }
];

const TemplateLibrary = () => {
  const navigate = useNavigate();

  const handleUseTemplate = (template) => {
    // Navigate to create page and pass pre-filled template data
    navigate('/create', { state: { templateData: template.defaultData } });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#f3f4f6' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>Template Library</h2>
        <p style={{ color: '#9ca3af', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Select a pre-built template to quickly generate customized agreements and proposals.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#60a5fa',
                    border: '1px solid #3b82f6',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px'
                  }}
                >
                  {tpl.category}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
                {tpl.title}
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
                {tpl.description}
              </p>
            </div>

            <button
              onClick={() => handleUseTemplate(tpl)}
              style={{
                width: '100%',
                padding: '0.65rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Use This Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateLibrary; 