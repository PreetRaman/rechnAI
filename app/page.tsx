'use client'

import { useState } from 'react'
import { AccountingRecord } from '@/utils/dataProcessing'
import ImageUpload from '@/components/ImageUpload'
import DataAnalysis from '@/components/DataAnalysis'
import ExcelDownload from '@/components/ExcelDownload'
import { Globe } from 'lucide-react'
import Logo from '@/components/Logo'

type Language = 'de' | 'en'

const translations = {
  de: {
    title: 'RechnAI',
    subtitle: 'Professionelle Buchhaltung für deutsche Steuerberater',
    uploadTitle: 'Dokument hochladen',
    uploadSubtitle: 'Laden Sie Rechnungen oder Kontoauszüge hoch (Bilder oder PDFs)',
    processing: 'Verarbeitung...',
    analysisTitle: 'Datenanalyse',
    analysisSubtitle: 'Überprüfen und bearbeiten Sie die extrahierten Daten',
    exportTitle: 'Export',
    exportSubtitle: 'Laden Sie die Daten als Excel-Datei herunter',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'Englisch',
    nextStep: 'Weiter',
    previousStep: 'Zurück',
    uploadNew: 'Neues Dokument hochladen'
  },
  en: {
    title: 'RechnAI',
    subtitle: 'Professional Accounting for German Certified Accountants',
    uploadTitle: 'Upload Document',
    uploadSubtitle: 'Upload receipts or bank statements (images or PDFs)',
    processing: 'Processing...',
    analysisTitle: 'Data Analysis',
    analysisSubtitle: 'Review and edit extracted data',
    exportTitle: 'Export',
    exportSubtitle: 'Download data as Excel file',
    language: 'Language',
    german: 'German',
    english: 'English',
    nextStep: 'Next',
    previousStep: 'Previous',
    uploadNew: 'Upload New Document'
  }
}

export default function Home() {
  const [extractedData, setExtractedData] = useState<AccountingRecord[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [language, setLanguage] = useState<Language>('de')
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'export'>('upload')

  const t = translations[language]

  const handleDataExtracted = (data: AccountingRecord[]) => {
    console.log('Data extracted in main component:', data)
    console.log('Number of records received:', data.length)
    console.log('Records details:', data.map((record, index) => `${index + 1}. ${JSON.stringify(record)}`))
    
    // Set the data directly (this should be the accumulated data from all files)
    setExtractedData(data)
    setCurrentStep('analysis')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleNextStep = () => {
    if (currentStep === 'upload') {
      setCurrentStep('analysis')
    } else if (currentStep === 'analysis') {
      setCurrentStep('export')
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 'export') {
      setCurrentStep('analysis')
    } else if (currentStep === 'analysis') {
      setCurrentStep('upload')
    }
  }

  const handleReset = () => {
    setExtractedData([])
    setCurrentStep('upload')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Logo and Language Selector */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="de">{t.german}</option>
              <option value="en">{t.english}</option>
            </select>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'upload' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">{t.uploadTitle}</span>
            </div>
            <div className={`w-12 h-0.5 ${currentStep === 'analysis' || currentStep === 'export' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'analysis' ? 'text-blue-600' : currentStep === 'export' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'analysis' ? 'bg-blue-600 border-blue-600 text-white' : currentStep === 'export' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">{t.analysisTitle}</span>
            </div>
            <div className={`w-12 h-0.5 ${currentStep === 'export' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'export' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'export' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">{t.exportTitle}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'upload' && (
            <ImageUpload 
              onDataExtracted={handleDataExtracted}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              language={language}
            />
          )}

          {currentStep === 'analysis' && extractedData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.analysisTitle}</h2>
              <p className="text-gray-600 mb-6">{t.analysisSubtitle}</p>
              {isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">{t.processing}</span>
                </div>
              ) : (
                <DataAnalysis 
                  data={extractedData}
                  onDataChange={setExtractedData}
                  language={language}
                />
              )}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t.previousStep}
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {t.nextStep}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'export' && extractedData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.exportTitle}</h2>
              <p className="text-gray-600 mb-6">{t.exportSubtitle}</p>
              <ExcelDownload 
                data={extractedData}
                language={language}
              />
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t.previousStep}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  {t.uploadNew}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 