# Accordo - Contract Negotiation Assistant

Accordo is a web application built with Next.js 15 and TypeScript that helps users negotiate better contracts by leveraging AI-powered clause suggestions. Users can upload contract drafts, define their key objectives (like payment terms, delivery times, and penalties), and get alternative clause formulations with risk scores.

## Features

- **Contract Upload**: Upload DOCX or PDF contract drafts
- **Objective Setting**: Define key parameters for payment terms, delivery times, and penalty rates
- **AI-powered Suggestions**: Get three alternative formulations for each contract clause
- **Risk Assessment**: Each suggestion comes with a risk score (1-10) indicating how favorable it is
- **PDF Generation**: Combine the selected clauses into a final contract PDF for download

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- An OpenAI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/accordo.git
   cd accordo
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to http://localhost:3000

## Usage

1. Upload your contract draft (PDF or DOCX format)
2. Set your objectives:
   - Payment Days: Desired payment terms in days
   - Delivery Days: Expected delivery timeframe
   - Penalty Rate: Percentage for late delivery penalties
3. Click "Start Negotiation" to get AI-generated alternatives
4. Review and select the preferred clause formulation for each section
5. Generate the final contract with your selected clauses
6. Download the PDF of your negotiated contract

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **API**: Next.js API Routes
- **PDF Processing**: pdf-parse, mammoth
- **PDF Generation**: Puppeteer, markdown-it
- **AI Integration**: OpenAI API

## Testing

Run the tests with:

```bash
npm test
```

## License

MIT
