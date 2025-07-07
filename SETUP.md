# RechnAI Setup Guide

## Prerequisites

1. Node.js 18+ installed
2. OpenAI API key (for GPT-4 Vision)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
Create a `.env.local` file in the root directory with:
```
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_APP_NAME=RechnAI
```

3. Get OpenAI API Key:
- Go to [OpenAI Platform](https://platform.openai.com/)
- Create an account or sign in
- Go to API Keys section
- Create a new API key
- Copy the key and paste it in `.env.local`

## Running the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

### OCR Processing Methods

1. **GPT-4 Vision (Recommended)**
   - Uses OpenAI's GPT-4 Vision API
   - Better accuracy and structured data extraction
   - Handles German documents excellently
   - Requires OpenAI API key

2. **Tesseract OCR (Fallback)**
   - Free, offline processing
   - Good for basic text extraction
   - Works without API key
   - Less accurate than GPT-4 Vision

### Document Types

1. **German Bank Statements (Kontoauszüge)**
   - Deutsche Bank, Sparkasse, Commerzbank, etc.
   - Extracts transaction dates, descriptions, amounts
   - Handles German date formats (DD.MM.YYYY)
   - Processes Euro amounts with German formatting

2. **German Receipts (Quittungen)**
   - Supermarket receipts, restaurant bills
   - Extracts store name, items, total amount
   - Handles VAT and payment method
   - Processes individual line items

### Data Export

- Excel (.xlsx) format
- German currency formatting (€)
- Categorized transactions
- Detailed transaction information

## Usage

1. Choose document type (Bank Statement or Receipt)
2. Select processing method (GPT-4 Vision recommended)
3. Upload image or drag & drop
4. Review extracted data
5. Edit if needed
6. Export to Excel

## Troubleshooting

### OpenAI API Issues
- Check API key is correct in `.env.local`
- Ensure you have credits in your OpenAI account
- Verify internet connection

### Image Quality
- Use clear, well-lit images
- Ensure text is readable
- Avoid blurry or low-resolution images

### German Text Recognition
- GPT-4 Vision handles German umlauts (äöüß) well
- Tesseract may struggle with complex German fonts
- For best results, use GPT-4 Vision for German documents 