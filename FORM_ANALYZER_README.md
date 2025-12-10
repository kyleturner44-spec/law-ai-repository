# Form Analyzer & Questionnaire System

## Overview

The Form Analyzer is an intelligent system that allows users to upload PDF forms, automatically detects the questions and fields that need to be filled, presents an interactive questionnaire to collect answers, and generates a completed PDF with all answers properly placed.

## Features

### 1. **File Upload**
- Upload PDF forms through a drag-and-drop interface
- Automatic file validation and preview
- Files are securely stored in Firebase Storage

### 2. **AI-Powered Form Analysis**
- Extracts text content from PDF files
- Identifies questions and required information
- Detects field types (text, email, phone, date, etc.)
- Maps coordinates for precise answer placement

### 3. **Interactive Questionnaire**
- Step-by-step question interface
- Progress tracking
- Answer validation
- Previous/Next navigation
- Real-time answer review

### 4. **Automated Form Filling**
- Generates completed PDF with answers
- Preserves original form formatting
- Places answers at correct coordinates
- Downloadable filled forms

### 5. **Data Persistence**
- All forms stored in Firebase Firestore
- Answer tracking and history
- Uploaded and filled forms available for download

## Architecture

### Components

1. **FormAnalyzer.js** - Main component handling the entire workflow
2. **aiService.js** - AI integration service for form analysis
3. **Firebase Integration** - Storage and database management

### Data Flow

```
User uploads PDF
    ↓
Store in Firebase Storage
    ↓
Extract text from PDF (PDF.js)
    ↓
Analyze with AI (Claude API via backend)
    ↓
Present questionnaire to user
    ↓
Collect answers
    ↓
Fill PDF with answers (pdf-lib)
    ↓
Upload filled PDF to Storage
    ↓
Provide download link
```

### Database Schema

**Firestore Collection: `forms`**

```javascript
{
  id: string,                    // Auto-generated
  fileName: string,              // Original filename
  fileUrl: string,               // Firebase Storage URL for original
  uploadDate: string,            // ISO timestamp
  status: string,                // 'analyzing' | 'analyzed' | 'completed'
  analysis: {                    // AI analysis result
    questions: [
      {
        id: string,              // Question ID (q1, q2, etc.)
        question: string,        // Question text
        type: string,            // Input type (text, email, tel, date)
        fieldName: string,       // Field identifier
        coordinates: {
          page: number,          // Page number
          x: number,             // X coordinate
          y: number,             // Y coordinate
          width: number,         // Field width
          height: number         // Field height
        }
      }
    ]
  },
  answers: {                     // User responses
    fieldName: string            // Key-value pairs
  },
  filledFormUrl: string,         // Firebase Storage URL for filled form
  completedDate: string          // ISO timestamp
}
```

## Setup Instructions

### Prerequisites

- Node.js 14+ and npm
- Firebase project with Firestore and Storage enabled
- Backend API for Claude integration (recommended)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Ensure Firebase Storage is enabled in your Firebase Console
   - Update Firebase security rules if needed

3. **Set up AI Backend (Important for Production):**

   The current implementation includes mock AI analysis for demonstration. For production use with real Claude AI:

   **Option A: Node.js Backend**

   Create a separate backend service:

   ```bash
   mkdir backend
   cd backend
   npm init -y
   npm install express @anthropic-ai/sdk cors dotenv
   ```

   Create `backend/server.js`:

   ```javascript
   import express from 'express';
   import Anthropic from '@anthropic-ai/sdk';
   import cors from 'cors';
   import dotenv from 'dotenv';

   dotenv.config();

   const app = express();
   app.use(cors());
   app.use(express.json());

   const anthropic = new Anthropic({
     apiKey: process.env.ANTHROPIC_API_KEY
   });

   app.post('/api/analyze-form', async (req, res) => {
     try {
       const { pdfText, pageCount } = req.body;

       const message = await anthropic.messages.create({
         model: "claude-3-5-sonnet-20241022",
         max_tokens: 4096,
         messages: [{
           role: "user",
           content: `Analyze this form and extract all questions that need to be answered.
                     For each question:
                     1. Write a clear question to ask the user
                     2. Determine the input type (text, email, tel, date, etc.)
                     3. Estimate coordinates where the answer should appear

                     Form content:
                     ${pdfText}

                     Return JSON in this exact format:
                     {
                       "questions": [
                         {
                           "id": "q1",
                           "question": "What is your name?",
                           "type": "text",
                           "fieldName": "name",
                           "coordinates": { "page": 1, "x": 100, "y": 200, "width": 200, "height": 20 }
                         }
                       ]
                     }`
         }]
       });

       const analysisText = message.content[0].text;
       const analysis = JSON.parse(analysisText);

       res.json(analysis);
     } catch (error) {
       console.error('Error analyzing form:', error);
       res.status(500).json({ error: 'Failed to analyze form' });
     }
   });

   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

   Create `backend/.env`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   PORT=3001
   ```

   Start the backend:
   ```bash
   node server.js
   ```

   **Option B: Serverless Functions (Vercel)**

   Create `api/analyze-form.js`:

   ```javascript
   import Anthropic from '@anthropic-ai/sdk';

   export default async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     const anthropic = new Anthropic({
       apiKey: process.env.ANTHROPIC_API_KEY
     });

     try {
       const { pdfText, pageCount } = req.body;

       const message = await anthropic.messages.create({
         model: "claude-3-5-sonnet-20241022",
         max_tokens: 4096,
         messages: [{
           role: "user",
           content: `Analyze this form... (same prompt as above)`
         }]
       });

       const analysisText = message.content[0].text;
       const analysis = JSON.parse(analysisText);

       res.json(analysis);
     } catch (error) {
       res.status(500).json({ error: 'Analysis failed' });
     }
   }
   ```

   Deploy to Vercel:
   ```bash
   npm install -g vercel
   vercel
   ```

4. **Update Frontend to Use Backend:**

   Modify `src/aiService.js`:

   ```javascript
   export async function analyzeFormWithClaude(pdfText, pageCount) {
     const response = await fetch('http://localhost:3001/api/analyze-form', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         pdfText,
         pageCount
       })
     });

     if (!response.ok) {
       throw new Error('Failed to analyze form');
     }

     return await response.json();
   }
   ```

   For production, use environment variables:

   Create `.env`:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   ```

   Update `aiService.js`:
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

   export async function analyzeFormWithClaude(pdfText, pageCount) {
     const response = await fetch(`${API_URL}/api/analyze-form`, {
       // ... rest of the code
     });
   }
   ```

### Running the Application

1. **Start the React app:**
   ```bash
   npm start
   ```

2. **Access the Form Analyzer:**
   - Click "Form Analyzer" in the navigation
   - Upload a PDF form
   - Follow the questionnaire
   - Download your filled form

## Usage Guide

### For End Users

1. **Upload a Form:**
   - Click the "Form Analyzer" button in the navigation
   - Click the upload area or drag and drop a PDF file
   - Click "Analyze Form"

2. **Answer Questions:**
   - Read each question carefully
   - Enter your answer in the provided field
   - Use "Previous" to go back and review/edit answers
   - Use "Next" to proceed to the next question
   - Track your progress with the progress bar

3. **Download Filled Form:**
   - After answering all questions, the form is automatically filled
   - Click "Download Filled Form" to get your completed PDF
   - Use "Fill Another Form" to start over

### For Developers

#### Adding Custom Form Field Detection

Modify `src/aiService.js` to add custom patterns:

```javascript
const patterns = [
  {
    regex: /your pattern here/i,
    question: 'Your question?',
    type: 'text',
    fieldName: 'yourFieldName'
  },
  // ... more patterns
];
```

#### Customizing the Questionnaire UI

Edit `src/FormAnalyzer.js`:

- Modify `renderQuestionnaireView()` for UI changes
- Update styling in className props
- Add validation logic in `handleAnswerChange()`

#### Enhancing Form Filling

Improve PDF generation in `fillForm()`:

```javascript
// Add custom fonts
const customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

// Customize text appearance
page.drawText(answer, {
  x: question.coordinates.x,
  y: page.getHeight() - question.coordinates.y,
  size: 12,
  font: customFont,
  color: rgb(0, 0, 0)
});
```

## Security Considerations

### API Keys
- **NEVER** expose API keys in frontend code
- Always use backend services for AI API calls
- Use environment variables for all secrets

### File Upload
- Validate file types and sizes
- Implement upload limits
- Scan files for malicious content in production

### Firebase Security
- Set up proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /forms/{formId} {
      // Only allow authenticated users to create/read their own forms
      allow create: if request.auth != null;
      allow read, update: if request.auth != null
                            && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null
                      && request.auth.uid == resource.data.userId;
    }
  }
}
```

- Configure Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /forms/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /filled-forms/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### PDF.js Worker Error
If you see PDF.js worker errors, ensure the worker is properly configured:

```javascript
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

### Firebase Storage Upload Fails
- Check Firebase Storage is enabled
- Verify storage rules allow uploads
- Ensure storage bucket name is correct in firebase.js

### Form Analysis Returns Empty
- Check backend API is running
- Verify Claude API key is set
- Review backend logs for errors
- Test with forms containing clear text (scanned images may not work)

### Filled Form Missing Text
- Verify coordinate calculations
- Check PDF page dimensions
- Adjust Y-coordinate calculations (PDFs use bottom-left origin)

## Advanced Features (Future Enhancements)

### 1. **OCR for Scanned Forms**
Integrate Tesseract.js for scanned document support:

```javascript
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(pdfImage, 'eng');
```

### 2. **Form Templates**
Create reusable templates for common forms

### 3. **Multi-Language Support**
Support forms in different languages

### 4. **Digital Signatures**
Add signature capture and embedding

### 5. **Form Validation Rules**
Implement custom validation per field type

### 6. **Batch Processing**
Process multiple forms simultaneously

### 7. **Form Comparison**
Compare filled forms with originals

## API Reference

### analyzeFormWithClaude(pdfText, pageCount)
Analyzes form text and returns questions.

**Parameters:**
- `pdfText` (string): Extracted text from PDF
- `pageCount` (number): Number of pages in PDF

**Returns:**
```javascript
{
  questions: Array<{
    id: string,
    question: string,
    type: string,
    fieldName: string,
    coordinates: {
      page: number,
      x: number,
      y: number,
      width: number,
      height: number
    }
  }>
}
```

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in `FormAnalyzer.js` and `aiService.js`
3. Check Firebase console for storage/database issues
4. Review browser console for frontend errors
5. Check backend logs for API errors

## License

This project is part of the AI Use Cases for Law repository.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Note:** This is a demonstration project. For production use, implement proper authentication, authorization, error handling, and security measures.
