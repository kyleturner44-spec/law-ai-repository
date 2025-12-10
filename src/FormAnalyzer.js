import React, { useState } from 'react';
import { Upload, FileText, MessageSquare, Download, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { analyzeFormWithClaude } from './aiService';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const FormAnalyzer = ({ onBack }) => {
  const [step, setStep] = useState('upload'); // upload, analyzing, questionnaire, filling, completed
  const [file, setFile] = useState(null);
  const [formId, setFormId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [filledFormUrl, setFilledFormUrl] = useState(null);

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const uploadToFirebase = async () => {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `forms/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      throw new Error('Failed to upload file');
    }
  };

  const analyzeFormWithAI = async (fileUrl) => {
    try {
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();

      // Convert PDF to text for analysis
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      // Call AI service for form analysis
      const analysis = await analyzeFormWithClaude(fullText, pdf.numPages);

      return analysis;
    } catch (error) {
      console.error('Error analyzing form:', error);
      throw new Error('Failed to analyze form');
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStep('analyzing');

    try {
      // 1. Upload to Firebase Storage
      const fileUrl = await uploadToFirebase();

      // 2. Create Firestore document
      const formDoc = await addDoc(collection(db, 'forms'), {
        fileName: file.name,
        fileUrl: fileUrl,
        uploadDate: new Date().toISOString(),
        status: 'analyzing'
      });
      setFormId(formDoc.id);

      // 3. Analyze the form
      const analysisResult = await analyzeFormWithAI(fileUrl);
      setAnalysis(analysisResult);

      // 4. Update Firestore with analysis
      await updateDoc(doc(db, 'forms', formDoc.id), {
        analysis: analysisResult,
        status: 'analyzed'
      });

      // 5. Move to questionnaire
      setStep('questionnaire');
    } catch (err) {
      setError(err.message);
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value) => {
    setAnswers(prev => ({
      ...prev,
      [analysis.questions[currentQuestion].fieldName]: value
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < analysis.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, proceed to fill form
      fillForm();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const fillForm = async () => {
    setLoading(true);
    setStep('filling');

    try {
      // Load the original PDF
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Add text to the PDF at specified coordinates
      for (const question of analysis.questions) {
        const answer = answers[question.fieldName] || '';
        const page = pages[question.coordinates.page - 1];

        page.drawText(answer, {
          x: question.coordinates.x,
          y: page.getHeight() - question.coordinates.y,
          size: 12
        });
      }

      // Save the filled PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Upload filled PDF to Firebase
      const timestamp = Date.now();
      const storageRef = ref(storage, `filled-forms/${timestamp}_filled_${file.name}`);
      await uploadBytes(storageRef, blob);
      const filledUrl = await getDownloadURL(storageRef);

      // Update Firestore
      await updateDoc(doc(db, 'forms', formId), {
        answers: answers,
        filledFormUrl: filledUrl,
        status: 'completed',
        completedDate: new Date().toISOString()
      });

      setFilledFormUrl(filledUrl);
      setStep('completed');
    } catch (err) {
      console.error('Error filling form:', err);
      setError('Failed to fill form. Please try again.');
      setStep('questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Form</h2>
          <p className="text-gray-600">Upload a PDF form and we'll help you fill it out</p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-amber-600 transition">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-700 mb-2">
              {file ? file.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500">PDF files only</p>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-600 rounded flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {file && (
          <button
            onClick={handleUploadAndAnalyze}
            disabled={loading}
            className="w-full mt-6 bg-amber-600 text-white py-4 rounded-lg hover:bg-amber-700 transition font-semibold text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <FileText size={20} />
                Analyze Form
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  const renderAnalyzingView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Loader className="w-16 h-16 text-amber-600 mx-auto mb-6 animate-spin" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Analyzing Your Form</h2>
        <p className="text-gray-600 text-lg">Please wait while we extract questions and map the form fields...</p>
      </div>
    </div>
  );

  const renderQuestionnaireView = () => {
    if (!analysis || !analysis.questions) return null;

    const question = analysis.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / analysis.questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-600">
                Question {currentQuestion + 1} of {analysis.questions.length}
              </span>
              <span className="text-sm font-semibold text-amber-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <MessageSquare className="w-12 h-12 text-amber-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{question.question}</h2>
            <input
              type={question.type}
              value={answers[question.fieldName] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition text-lg"
              placeholder="Enter your answer..."
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            {currentQuestion > 0 && (
              <button
                onClick={handlePreviousQuestion}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNextQuestion}
              disabled={!answers[question.fieldName]}
              className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === analysis.questions.length - 1 ? 'Fill Form' : 'Next'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Your Answers</h3>
          <div className="space-y-2">
            {analysis.questions.map((q, idx) => (
              <div
                key={q.id}
                className={`p-3 rounded-lg ${
                  idx === currentQuestion
                    ? 'bg-amber-50 border-2 border-amber-600'
                    : answers[q.fieldName]
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {idx + 1}. {q.question}
                  </span>
                  {answers[q.fieldName] && (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                </div>
                {answers[q.fieldName] && (
                  <p className="text-sm text-gray-600 mt-1">{answers[q.fieldName]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFillingView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Loader className="w-16 h-16 text-amber-600 mx-auto mb-6 animate-spin" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Filling Your Form</h2>
        <p className="text-gray-600 text-lg">Generating your completed form with all your answers...</p>
      </div>
    </div>
  );

  const renderCompletedView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Form Completed!</h2>
        <p className="text-gray-600 text-lg mb-8">Your form has been filled out and is ready to download.</p>

        <div className="space-y-4">
          <a
            href={filledFormUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-8 py-4 rounded-lg hover:bg-amber-700 transition font-semibold text-lg"
          >
            <Download size={24} />
            Download Filled Form
          </a>

          <button
            onClick={() => {
              setStep('upload');
              setFile(null);
              setAnalysis(null);
              setAnswers({});
              setCurrentQuestion(0);
              setFilledFormUrl(null);
              setFormId(null);
            }}
            className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Fill Another Form
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={onBack}
          className="mb-6 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
        >
          ← Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Form Analyzer & Assistant</h1>
          <p className="text-gray-600 text-lg">Upload any form and we'll help you fill it out step by step</p>
        </div>
      </div>

      {step === 'upload' && renderUploadView()}
      {step === 'analyzing' && renderAnalyzingView()}
      {step === 'questionnaire' && renderQuestionnaireView()}
      {step === 'filling' && renderFillingView()}
      {step === 'completed' && renderCompletedView()}
    </div>
  );
};

export default FormAnalyzer;
