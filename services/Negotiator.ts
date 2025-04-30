import { OpenAI } from 'openai';
import { ClauseSuggestion, Objectives } from '../types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Negotiator service for generating contract clause suggestions
 * using OpenAI's LLM capabilities
 */
export class Negotiator {
  /**
   * Generates alternative formulations for contract clauses based on user objectives
   * @param contractText The original contract text
   * @param objectives User-defined negotiation objectives
   * @returns Array of clause suggestions with alternatives and risk scores
   */
  static async generateSuggestions(
    contractText: string,
    objectives: Objectives
  ): Promise<ClauseSuggestion[]> {
    const results: ClauseSuggestion[] = [];

    // Generate payment terms suggestions
    const paymentSuggestions = await this.generatePaymentClause(
      contractText,
      objectives
    );
    results.push(paymentSuggestions);

    // Generate delivery time suggestions
    const deliverySuggestions = await this.generateDeliveryClause(
      contractText,
      objectives
    );
    results.push(deliverySuggestions);

    // Generate penalty suggestions
    const penaltySuggestions = await this.generatePenaltyClause(
      contractText,
      objectives
    );
    results.push(penaltySuggestions);

    return results;
  }

  /**
   * Generates alternative payment terms clauses
   */
  private static async generatePaymentClause(
    contractText: string,
    objectives: Objectives
  ): Promise<ClauseSuggestion> {
    const prompt = `
      Analyze the following contract text and extract the payment terms clause.
      Then provide 3 alternative formulations for the PAYMENT TERMS clause, optimizing for payment within ${objectives.paymentDays} days.
      For each alternative, assign a risk score from 1-10 (1 being most favorable to client, 10 being most favorable to provider).
      Return ONLY a JSON object with format: {"suggestions": [string, string, string], "scores": [number, number, number]}
    `;

    return this.generateClauseWithLLM('payment', contractText, prompt);
  }

  /**
   * Generates alternative delivery time clauses
   */
  private static async generateDeliveryClause(
    contractText: string,
    objectives: Objectives
  ): Promise<ClauseSuggestion> {
    const prompt = `
      Analyze the following contract text and extract the delivery timeframe clause.
      Then provide 3 alternative formulations for the DELIVERY TIME clause, optimizing for delivery within ${objectives.deliveryDays} days.
      For each alternative, assign a risk score from 1-10 (1 being most favorable to client, 10 being most favorable to provider).
      Return ONLY a JSON object with format: {"suggestions": [string, string, string], "scores": [number, number, number]}
    `;

    return this.generateClauseWithLLM('delivery', contractText, prompt);
  }

  /**
   * Generates alternative penalty clauses
   */
  private static async generatePenaltyClause(
    contractText: string,
    objectives: Objectives
  ): Promise<ClauseSuggestion> {
    const prompt = `
      Analyze the following contract text and extract the penalties clause.
      Then provide 3 alternative formulations for the PENALTIES clause, implementing a ${objectives.penaltyRate}% penalty rate for late delivery or services.
      For each alternative, assign a risk score from 1-10 (1 being most favorable to client, 10 being most favorable to provider).
      Return ONLY a JSON object with format: {"suggestions": [string, string, string], "scores": [number, number, number]}
    `;

    return this.generateClauseWithLLM('penalty', contractText, prompt);
  }

  /**
   * Helper method to generate clauses using OpenAI
   */
  private static async generateClauseWithLLM(
    field: 'payment' | 'delivery' | 'penalty',
    contractText: string,
    prompt: string
  ): Promise<ClauseSuggestion> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a contract negotiation expert specializing in legal language optimization.' },
          { role: 'user', content: `${prompt}\n\nContract text: ${contractText}` }
        ],
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message.content;
      
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      const parsedResponse = JSON.parse(responseContent);
      
      return {
        field,
        suggestions: parsedResponse.suggestions,
        scores: parsedResponse.scores,
      };
    } catch (error) {
      console.error(`Error generating ${field} clause:`, error);
      
      // Return fallback in case of error
      return {
        field,
        suggestions: ['Error generating suggestions. Please try again.'],
        scores: [5],
      };
    }
  }
} 