import { Negotiator } from '../services/Negotiator';
import { ClauseSuggestion, Objectives } from '../types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      suggestions: [
                        'Suggested clause 1',
                        'Suggested clause 2',
                        'Suggested clause 3',
                      ],
                      scores: [3, 5, 8],
                    }),
                  },
                },
              ],
            }),
          },
        },
      };
    }),
  };
});

describe('Negotiator Service', () => {
  // Sample contract text for testing
  const sampleContract = `
    AGREEMENT BETWEEN PARTIES
    
    PAYMENT TERMS:
    The Client shall pay the Provider the agreed amount of $10,000 within 45 days of receiving the invoice.
    
    DELIVERY TIME:
    The Provider shall deliver all products within 30 days from the date of this agreement.
    
    PENALTIES:
    In case of late delivery, a penalty of 2% will be applied for each week of delay.
  `;

  // Sample objectives for testing
  const objectives: Objectives = {
    paymentDays: 30,
    deliveryDays: 14,
    penaltyRate: 5,
  };

  test('generateSuggestions returns the correct structure with suggestions for each clause type', async () => {
    // Execute the method under test
    const result = await Negotiator.generateSuggestions(sampleContract, objectives);

    // Assertions
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(3);

    // Check the structure of each result item
    result.forEach((clauseSuggestion: ClauseSuggestion) => {
      // Check that each item has the expected field
      expect(['payment', 'delivery', 'penalty']).toContain(clauseSuggestion.field);
      
      // Check that suggestions array exists and is not empty
      expect(clauseSuggestion.suggestions).toBeInstanceOf(Array);
      expect(clauseSuggestion.suggestions.length).toBeGreaterThan(0);
      
      // Check that scores array exists and matches suggestions length
      expect(clauseSuggestion.scores).toBeInstanceOf(Array);
      expect(clauseSuggestion.scores.length).toBe(clauseSuggestion.suggestions.length);
    });

    // Check specific field existence
    const hasPaymentClause = result.some(cs => cs.field === 'payment');
    const hasDeliveryClause = result.some(cs => cs.field === 'delivery');
    const hasPenaltyClause = result.some(cs => cs.field === 'penalty');

    expect(hasPaymentClause).toBe(true);
    expect(hasDeliveryClause).toBe(true);
    expect(hasPenaltyClause).toBe(true);
  });
}); 