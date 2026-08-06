import '@testing-library/jest-dom';
import { vi } from 'vitest';

// -----------------------------------------------------------------------------
// 1. Canvas Mock (Required for html2canvas & react-signature-canvas)
// -----------------------------------------------------------------------------
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn((x, y, w, h) => ({ data: new Array(w * h * 4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');

// -----------------------------------------------------------------------------
// 2. Mock External Heavy Libraries (html2canvas & jsPDF)
// -----------------------------------------------------------------------------
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 800,
    height: 1000,
    toDataURL: () => 'data:image/png;base64,mockCanvasData',
  }),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    output: vi.fn().mockReturnValue('data:application/pdf;base64,mockPdf'),
  })),
}));

// -----------------------------------------------------------------------------
// 3. Browser Utility Mocks
// -----------------------------------------------------------------------------
global.fetch = vi.fn();

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(true),
  },
}); 