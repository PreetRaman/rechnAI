'use client'

import { useState } from 'react'
import { AccountingRecord } from '@/utils/dataProcessing'
import ImageUpload from '@/components/ImageUpload'
import DataAnalysis from '@/components/DataAnalysis'
import ExcelDownload from '@/components/ExcelDownload'
import { Globe } from 'lucide-react'
import Logo from '@/components/Logo'
import ResponsiveTest from '@/components/ResponsiveTest'

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header with Logo and Language Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Logo size="md" />
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xs sm:max-w-none">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base flex-1 sm:flex-none"
            >
              <option value="de">{t.german}</option>
              <option value="en">{t.english}</option>
            </select>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 max-w-full overflow-hidden">
            <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-sm sm:text-base ${currentStep === 'upload' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium text-sm sm:text-base hidden xs:inline">{t.uploadTitle}</span>
            </div>
            <div className={`w-8 h-0.5 sm:w-12 sm:h-0.5 ${currentStep === 'analysis' || currentStep === 'export' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'analysis' ? 'text-blue-600' : currentStep === 'export' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-sm sm:text-base ${currentStep === 'analysis' ? 'bg-blue-600 border-blue-600 text-white' : currentStep === 'export' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium text-sm sm:text-base hidden xs:inline">{t.analysisTitle}</span>
            </div>
            <div className={`w-8 h-0.5 sm:w-12 sm:h-0.5 ${currentStep === 'export' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'export' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-sm sm:text-base ${currentStep === 'export' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium text-sm sm:text-base hidden xs:inline">{t.exportTitle}</span>
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
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">{t.analysisTitle}</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{t.analysisSubtitle}</p>
              {isProcessing ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 text-sm sm:text-base">{t.processing}</span>
                </div>
              ) : (
                <DataAnalysis 
                  data={extractedData}
                  onDataChange={setExtractedData}
                  language={language}
                />
              )}
              
              <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-2 sm:space-y-0">
                <button
                  onClick={handlePreviousStep}
                  className="px-4 sm:px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm sm:text-base order-2 sm:order-1"
                >
                  {t.previousStep}
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 sm:px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 text-sm sm:text-base order-1 sm:order-2"
                >
                  {t.nextStep}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'export' && extractedData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">{t.exportTitle}</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{t.exportSubtitle}</p>
              <ExcelDownload 
                data={extractedData}
                language={language}
              />
              
              <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-2 sm:space-y-0">
                <button
                  onClick={handlePreviousStep}
                  className="px-4 sm:px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm sm:text-base order-2 sm:order-1"
                >
                  {t.previousStep}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 sm:px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 text-sm sm:text-base order-1 sm:order-2"
                >
                  {t.uploadNew}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ResponsiveTest />
    </div>
  )
} 