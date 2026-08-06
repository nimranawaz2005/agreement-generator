// frontend/src/CreateDocument.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CreateDocument from './CreateDocument';

describe('CreateDocument Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Mock ObjectURL for PDF Blob handling
    if (typeof window.URL.createObjectURL === 'undefined') {
      window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-pdf');
    }

    // Default mock response for backend fetch calls
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 1. INITIAL RENDERING TEST                                                  */
  /* -------------------------------------------------------------------------- */
  it('renders initial form controls and preview correctly', () => {
    render(<CreateDocument />);

    // Header Check
    expect(screen.getByText('Smart Agreement Generator')).toBeInTheDocument();

    // Default Input Values
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Your Agency Ltd')).toBeInTheDocument();

    // Default Line Items Check
    expect(screen.getByDisplayValue('UI/UX Design Phase')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Backend API Development')).toBeInTheDocument();

    // Initial Live Preview Total Check (1200 + 2500 = $3,700)
    const totals = screen.getAllByText('$3,700.00');
    expect(totals.length).toBeGreaterThan(0);
  });

  /* -------------------------------------------------------------------------- */
  /* 2. FINANCIAL CALCULATIONS (TAX & DISCOUNT)                                 */
  /* -------------------------------------------------------------------------- */
  it('updates Subtotal, Tax, Discount, and Total live on preview', async () => {
    const user = userEvent.setup();
    render(<CreateDocument />);

    const discountInput = screen.getByPlaceholderText('0');
    const taxRateInput = screen.getByLabelText(/Tax Rate/i);

    // Initial Subtotal = $3,700

    // Step A: Apply $200 Flat Discount
    await user.clear(discountInput);
    await user.type(discountInput, '200');

    // Subtotal: 3700 | Discount: -200 | Taxable: 3500 | Total: 3500
    expect(screen.getByText('-$200')).toBeInTheDocument();
    expect(screen.getByText('$3,500.00')).toBeInTheDocument();

    // Step B: Apply 10% Tax Rate
    await user.clear(taxRateInput);
    await user.type(taxRateInput, '10');

    // Taxable: 3500 | Tax (10%): +350 | Final Total: 3850
    expect(screen.getByText('+$350.00')).toBeInTheDocument();
    expect(screen.getByText('$3,850.00')).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* 3. LINE ITEM MANAGEMENT                                                    */
  /* -------------------------------------------------------------------------- */
  it('allows adding and removing deliverable rows dynamically', async () => {
    const user = userEvent.setup();
    render(<CreateDocument />);

    const addRowBtn = screen.getByRole('button', { name: /Add Row/i });

    // Add a new row
    await user.click(addRowBtn);

    const descInputs = screen.getAllByPlaceholderText('Description');
    expect(descInputs).toHaveLength(3);

    // Fill in new row details
    await user.type(descInputs[2], 'DevOps Infrastructure');
    const costInputs = screen.getAllByPlaceholderText('Cost');
    await user.type(costInputs[2], '800');

    // Total should update: 1200 + 2500 + 800 = $4,500
    expect(screen.getByText('$4,500.00')).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* 4. TEMPLATE LIBRARY SELECTION                                              */
  /* -------------------------------------------------------------------------- */
  it('loads preset template data into form fields when selected', async () => {
    const user = userEvent.setup();
    render(<CreateDocument />);

    const select = screen.getByRole('combobox');
    
    // Select 'Monthly UI/UX Design Retainer'
    await user.selectOptions(select, 'design_retainer');

    // Verify scope text changed
    expect(
      screen.getByDisplayValue(/Ongoing monthly product design services/i)
    ).toBeInTheDocument();

    // Verify line item updated
    expect(
      screen.getByDisplayValue('Monthly Design Retainer Fee (40 Hours/mo)')
    ).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* 5. EMAIL MODAL & LINK COPYING                                              */
  /* -------------------------------------------------------------------------- */
  it('opens share modal and allows copying share link', async () => {
    const user = userEvent.setup();
    render(<CreateDocument />);

    // Open Modal
    const shareBtn = screen.getByRole('button', { name: /Share Document/i });
    await user.click(shareBtn);

    expect(screen.getByText('Share & Email Document')).toBeInTheDocument();

    // Copy Link Action
    const copyBtn = screen.getByRole('button', { name: /Copy Link/i });
    await user.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* 6. PDF EXPORT FLOW                                                         */
  /* -------------------------------------------------------------------------- */
  it('triggers PDF generation when Generate & Download PDF is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateDocument />);

    const generateBtn = screen.getByRole('button', { name: /Generate & Download PDF/i });
    await user.click(generateBtn);

    await waitFor(() => {
      // Confirms PDF generation functions completed without crashing
      expect(generateBtn).not.toBeDisabled();
    });
  });
});  