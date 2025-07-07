# RechnAI - Accounting App

A modern Next.js application that allows users to upload accounting documents, extract data using OCR (Optical Character Recognition), and generate Excel files for financial record management.

## Features

- **Image Upload**: Drag and drop or click to upload accounting documents (JPG, PNG, etc.)
- **OCR Processing**: Uses Tesseract.js to extract text from images
- **Data Analysis**: Review, edit, and categorize extracted financial data
- **Excel Generation**: Export processed data to Excel format for use in accounting software
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Real-time Processing**: Live data extraction and analysis

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Tesseract.js**: OCR library for text extraction
- **SheetJS (XLSX)**: Excel file generation
- **Lucide React**: Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rechnai
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Step 1: Upload Document
- Drag and drop an accounting document or click to browse
- Supported formats: JPG, PNG, and other image formats
- The app will show a preview of the uploaded image

### Step 2: Extract Data
- Click "Extract Data" to process the image using OCR
- The app will analyze the image and extract text
- You can view the raw extracted text if needed

### Step 3: Review and Edit
- Review the extracted data in a table format
- Edit any fields directly in the table
- Add categories to organize your data
- Add new rows or delete existing ones

### Step 4: Generate Excel
- Click "Generate XLS" to create a downloadable Excel file
- Customize the filename if needed
- Download the Excel file for use in accounting software

## Project Structure

```
rechnai/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page component
├── components/
│   ├── ImageUpload.tsx      # Image upload and OCR processing
│   ├── DataAnalysis.tsx     # Data review and editing
│   └── CSVDownload.tsx      # CSV generation and download
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Features in Detail

### OCR Processing
- Uses Tesseract.js for accurate text extraction
- Supports multiple languages (currently English)
- Handles various document layouts and formats

### Data Parsing
- Automatically detects dates, amounts, and descriptions
- Uses regex patterns to identify financial data
- Allows manual editing and categorization

### Excel Export
- Generates properly formatted Excel files (.xlsx)
- Includes headers for easy import into accounting software
- Supports custom filenames

## Customization

### Adding New Categories
Edit the `categories` array in `components/DataAnalysis.tsx`:

```typescript
const categories = [
  'Income',
  'Expenses',
  'Utilities',
  'Rent',
  'Food',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Insurance',
  'Other',
  'Your New Category' // Add your custom categories here
]
```

### Modifying Data Parsing
Update the `parseAccountingData` function in `components/ImageUpload.tsx` to match your specific document formats.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Heroku

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support or questions, please open an issue on GitHub or contact the development team. 