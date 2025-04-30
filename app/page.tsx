"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { ClauseSuggestion, ClauseField } from '@/types';

export default function Home() {
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [contractText, setContractText] = useState('');
  
  // State for objectives
  const [paymentDays, setPaymentDays] = useState(30);
  const [deliveryDays, setDeliveryDays] = useState(14);
  const [penaltyRate, setPenaltyRate] = useState(5);
  
  // State for API processing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for negotiation results
  const [suggestions, setSuggestions] = useState<ClauseSuggestion[]>([]);
  
  // State for selected clauses
  const [selectedClauses, setSelectedClauses] = useState<Record<ClauseField, string>>({
    payment: '',
    delivery: '',
    penalty: ''
  });
  
  // State for PDF generation
  const [pdfUrl, setPdfUrl] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please upload a contract file');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('paymentDays', paymentDays.toString());
      formData.append('deliveryDays', deliveryDays.toString());
      formData.append('penaltyRate', penaltyRate.toString());
      
      const response = await fetch('/api/negotiate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to negotiate contract');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions);
      
      // Use the generic contract text returned by the API
      setContractText(data.contractText || '');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clause selection
  const handleClauseSelection = (field: ClauseField, text: string) => {
    setSelectedClauses(prev => ({
      ...prev,
      [field]: text
    }));
  };
  
  // Handle final contract generation
  const handleGeneratePdf = async () => {
    // Check if all clauses are selected
    const missingClauses = Object.entries(selectedClauses)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (missingClauses.length > 0) {
      setError(`Please select clauses for: ${missingClauses.join(', ')}`);
      return;
    }
    
    setIsGeneratingPdf(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractText,
          selectedClauses,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate contract');
      }
      
      const data = await response.json();
      setPdfUrl(data.pdfUrl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate contract');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Get color class based on risk score
  const getRiskColorClass = (score: number) => {
    if (score <= 3) return 'bg-green-100 text-green-800';
    if (score <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  // Render risk badge
  const RiskBadge = ({ score }: { score: number }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColorClass(score)}`}>
      Risk: {score}/10
    </span>
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-white text-gray-800">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit">
          <code className="font-mono font-bold">Accordo - Contract Negotiation Assistant</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0">
            By{' '}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              width={100}
              height={24}
              priority
            />
          </div>
        </div>
      </div>

      <div className="mb-32 grid gap-8 text-center lg:max-w-5xl lg:w-full lg:text-left mt-20 md:mt-32">
        {/* Header Section */}
        <h1 className="text-3xl md:text-4xl font-bold text-center w-full mt-6 mb-4">
          Contract Negotiation Assistant
        </h1>
        <p className="text-center text-xl mb-10">
          Upload your contract draft, set your objectives, and get AI-powered clause alternatives
        </p>
        
        {/* Error display */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        {!suggestions.length ? (
          /* Initial Form */
          <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-gray-50 rounded-lg shadow">
            <div className="mb-4">
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Contract (PDF or DOCX)
              </label>
              <input
                type="file"
                id="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="block w-full text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="paymentDays" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Days
                </label>
                <input
                  type="number"
                  id="paymentDays"
                  value={paymentDays}
                  onChange={(e) => setPaymentDays(Number(e.target.value))}
                  className="block w-full text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                  min="1"
                  max="90"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryDays" className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Days
                </label>
                <input
                  type="number"
                  id="deliveryDays"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(Number(e.target.value))}
                  className="block w-full text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                  min="1"
                  max="90"
                />
              </div>
              
              <div>
                <label htmlFor="penaltyRate" className="block text-sm font-medium text-gray-700 mb-2">
                  Penalty Rate (%)
                </label>
                <input
                  type="number"
                  id="penaltyRate"
                  value={penaltyRate}
                  onChange={(e) => setPenaltyRate(Number(e.target.value))}
                  className="block w-full text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                  min="0"
                  max="20"
                  step="0.5"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : 'Start Negotiation'}
            </button>
          </form>
        ) : pdfUrl ? (
          /* PDF Download View */
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Your Contract is Ready!</h2>
            <p className="mb-6">Your contract has been generated with your selected clauses.</p>
            <a 
              href={pdfUrl}
              download
              className="py-3 px-6 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Download Contract PDF
            </a>
            <button
              onClick={() => {
                setSuggestions([]);
                setSelectedClauses({ payment: '', delivery: '', penalty: '' });
                setPdfUrl('');
                setFile(null);
              }}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Start Over
            </button>
          </div>
        ) : (
          /* Clause Selection View */
          <div className="grid gap-8">
            <h2 className="text-2xl font-bold">Select Your Preferred Clauses</h2>
            <p className="text-gray-600">
              For each section, review the alternatives and select the one that best fits your needs.
            </p>
            
            {suggestions.map((clauseGroup) => (
              <div key={clauseGroup.field} className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 capitalize">
                  {clauseGroup.field === 'payment' ? 'Payment Terms' : 
                   clauseGroup.field === 'delivery' ? 'Delivery Time' : 'Penalties'}
                </h3>
                
                <div className="grid gap-4">
                  {clauseGroup.suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${
                        selectedClauses[clauseGroup.field] === suggestion 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleClauseSelection(clauseGroup.field, suggestion)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Option {index + 1}</span>
                        <RiskBadge score={clauseGroup.scores[index]} />
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className={`w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isGeneratingPdf ? 'Generating Contract...' : 'Generate Final Contract'}
            </button>
            
            <button
              onClick={() => {
                setSuggestions([]);
                setSelectedClauses({ payment: '', delivery: '', penalty: '' });
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
