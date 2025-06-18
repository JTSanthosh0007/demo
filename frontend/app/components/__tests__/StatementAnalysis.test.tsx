import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatementAnalysis from '../StatementAnalysis';

// Mock the useState hook
const mockSetState = jest.fn();
const originalUseState = React.useState;

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      transactions: [
        {
          date: '2024-01-01',
          amount: 100,
          description: 'Test Transaction',
          category: 'Food'
        }
      ],
      totalReceived: 1000,
      totalSpent: 500,
      categoryBreakdown: {
        'Food': 500
      }
    })
  })
) as jest.Mock;

describe('StatementAnalysis Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  const navigateToAnalysis = async (getByText: Function, container: HTMLElement) => {
    const phonepeButton = getByText('PhonePe');
    fireEvent.click(phonepeButton);
    await waitFor(() => {
      expect(getByText('Upload PhonePe Statement')).toBeInTheDocument();
    });
  };

  const getFileInput = (container: HTMLElement) => {
    return container.querySelector('input[type="file"]') as HTMLInputElement;
  };

  it('handles PDF upload correctly', async () => {
    const { getByText, container } = render(<StatementAnalysis />);
    await navigateToAnalysis(getByText, container);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(getByText('Processing your statement...')).toBeInTheDocument();
    });
  });

  it('displays transaction summary correctly', async () => {
    const { getByText, container } = render(<StatementAnalysis />);
    await navigateToAnalysis(getByText, container);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(getByText('Transaction Summary')).toBeInTheDocument();
      expect(getByText('₹ 1,000.00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders category breakdown correctly', async () => {
    const { getByText, container } = render(<StatementAnalysis />);
    await navigateToAnalysis(getByText, container);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const categorySection = getByText('Spending by Category').closest('.bg-gray-900') as HTMLElement;
      expect(categorySection).toBeInTheDocument();
      expect(within(categorySection).getByText('Food')).toBeInTheDocument();
      expect(within(categorySection).getByText('₹ 500.00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays recent transactions', async () => {
    const { getByText, container } = render(<StatementAnalysis />);
    await navigateToAnalysis(getByText, container);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(getByText('Recent Transactions')).toBeInTheDocument();
      expect(getByText('Test Transaction')).toBeInTheDocument();
      expect(getByText('₹ 100.00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows error message for invalid file', async () => {
    const { getByText, container } = render(<StatementAnalysis />);
    await navigateToAnalysis(getByText, container);

    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(getByText('Please upload a PDF file')).toBeInTheDocument();
    });
  });

  it('shows loading state while processing', async () => {
    const { getByText, container } = render(<StatementAnalysis />);
    await navigateToAnalysis(getByText, container);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(getByText('Processing your statement...')).toBeInTheDocument();
    });
  });
}); 