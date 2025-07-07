'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileImage, Loader2, Eye, EyeOff, Receipt, CreditCard, Brain, X, CheckCircle, AlertCircle } from 'lucide-react'
import { extractFinancialData, AccountingRecord, convertFileToBase64, processOCRResponse, isValidFileType, isValidFileSize } from '@/utils/dataProcessing'

interface ImageUploadProps {
  onDataExtracted: (data: AccountingRecord[]) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  language: 'de' | 'en'
}

type DocumentType = 'bank-statement' | 'receipt' | null

interface FileUploadStatus {
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  error?: string
  extractedData?: AccountingRecord[]
  rawText?: string
}

const translations = {
  de: {
    uploadTitle: 'Dokument hochladen',
    uploadSubtitle: 'Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen',
    supportedFormats: 'Unterstützte Formate: JPEG, JPG, PNG, BMP',
    maxSize: 'Maximale Dateigröße: 10 MB',
    processingMethod: 'Verarbeitungsmethode',
    openai: 'OpenAI Vision API',
    highestAccuracy: 'Höchste Genauigkeit (API-Schlüssel erforderlich)',
    tesseract: 'Tesseract OCR',
    localProcessing: 'Offline-Verarbeitung (kostenlos)',
    preview: 'Vorschau',
    reset: 'Zurücksetzen',
    detectedType: 'Erkannt:',
    receipt: 'Rechnung/Beleg',
    bankStatement: 'Kontoauszug',
    process: 'Verarbeiten',
    processing: 'Verarbeite...',
    extractedText: 'Extrahierter Text',
    show: 'Anzeigen',
    hide: 'Ausblenden',
    tipsTitle: 'Tipps für beste Ergebnisse',
    tipsReceiptsTitle: 'Für Rechnungen/Belege:',
    tipsReceipts1: 'Stellen Sie sicher, dass alle wichtigen Informationen sichtbar sind',
    tipsReceipts2: 'Vermeiden Sie Schatten und Reflexionen',
    tipsReceipts3: 'Fotografieren Sie bei gutem Licht',
    tipsBankTitle: 'Für Kontoauszüge:',
    tipsBank1: 'Zeigen Sie alle Transaktionen vollständig an',
    tipsBank2: 'Vermeiden Sie abgeschnittene Zeilen',
    tipsBank3: 'Stellen Sie sicher, dass Datum und Beträge lesbar sind',
    noDataFound: 'Keine Daten gefunden. Bitte versuchen Sie es mit einem anderen Bild.',
    openaiError: 'Fehler bei der OpenAI-Verarbeitung.',
    networkError: ' Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
    switchToTesseract: ' Versuchen Sie Tesseract OCR (offline) als Alternative.',
    multipleFiles: 'Dateien hochladen',
    uploadMultiple: 'Mehrere Dateien hochladen',
    processingFiles: 'Verarbeite Dateien...',
    completedFiles: 'Abgeschlossene Dateien',
    errorFiles: 'Fehlerhafte Dateien',
    pendingFiles: 'Ausstehende Dateien',
    downloadAll: 'Alle Daten herunterladen',
    clearAll: 'Alle löschen',
    totalFiles: 'Dateien insgesamt',
    successfulFiles: 'Erfolgreich verarbeitet',
    failedFiles: 'Fehlgeschlagen'
  },
  en: {
    uploadTitle: 'Upload Document',
    uploadSubtitle: 'Drag files here or click to select',
    supportedFormats: 'Supported formats: JPEG, JPG, PNG, BMP',
    maxSize: 'Maximum file size: 10 MB',
    processingMethod: 'Processing Method',
    openai: 'OpenAI Vision API',
    highestAccuracy: 'Highest accuracy (API key required)',
    tesseract: 'Tesseract OCR',
    localProcessing: 'Offline processing (free)',
    preview: 'Preview',
    reset: 'Reset',
    detectedType: 'Detected:',
    receipt: 'Receipt/Invoice',
    bankStatement: 'Bank Statement',
    process: 'Process',
    processing: 'Processing...',
    extractedText: 'Extracted Text',
    show: 'Show',
    hide: 'Hide',
    tipsTitle: 'Tips for best results',
    tipsReceiptsTitle: 'For receipts/invoices:',
    tipsReceipts1: 'Make sure all important information is visible',
    tipsReceipts2: 'Avoid shadows and reflections',
    tipsReceipts3: 'Take photos in good lighting',
    tipsBankTitle: 'For bank statements:',
    tipsBank1: 'Show all transactions completely',
    tipsBank2: 'Avoid cut-off lines',
    tipsBank3: 'Make sure dates and amounts are readable',
    noDataFound: 'No data found. Please try with a different image.',
    openaiError: 'Error processing with OpenAI.',
    networkError: ' Network error. Please check your internet connection.',
    switchToTesseract: ' Try Tesseract OCR (offline) as an alternative.',
    multipleFiles: 'Upload Files',
    uploadMultiple: 'Upload Multiple Files',
    processingFiles: 'Processing files...',
    completedFiles: 'Completed Files',
    errorFiles: 'Error Files',
    pendingFiles: 'Pending Files',
    downloadAll: 'Download All Data',
    clearAll: 'Clear All',
    totalFiles: 'Total Files',
    successfulFiles: 'Successfully Processed',
    failedFiles: 'Failed'
  }
}

export default function ImageUpload({ onDataExtracted, isProcessing, setIsProcessing, language }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileUploadStatus[]>([])
  const [processingMethod, setProcessingMethod] = useState<'openai' | 'tesseract'>('openai')
  const [extractedText, setExtractedText] = useState('')
  const [showText, setShowText] = useState(false)
  const [fileError, setFileError] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>(null)
  const [detectedType, setDetectedType] = useState<DocumentType>(null)
  const [allExtractedData, setAllExtractedData] = useState<AccountingRecord[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detectDocumentType = (text: string): DocumentType => {
    const lowerText = text.toLowerCase()
    
    // Keywords for bank statements (with weights)
    const bankKeywords = [
      'kontoauszug', 'kontostand', 'buchung', 'transaktion', 'überweisung',
      'lastschrift', 'gutschrift', 'abhebung', 'bargeldabhebung', 'penny', 'sagt', 'danke',
      'account statement', 'balance', 'transaction', 'transfer', 'withdrawal',
      'booking', 'debit', 'credit', 'withdrawal', 'valuta', 'verwendungszweck',
      'sparkasse', 'deutsche bank', 'commerzbank', 'volksbank', 'raiffeisenbank',
      'konto', 'kontonummer', 'iban', 'bic', 'blz', 'haben', 'soll', 'saldo'
    ]
    
    // Keywords for receipts/invoices (with weights)
    const receiptKeywords = [
      'rechnung', 'beleg', 'quittung', 'invoice', 'receipt', 'bill',
      'mwst', 'umsatzsteuer', 'vat', 'tax', 'total', 'summe',
      'betrag', 'amount', 'preis', 'price', 'rechnungsnummer', 'hamburgerei',
      'restaurant', 'café', 'imbiss', 'gastronomie', 'hotel', 'bar',
      'trinkgeld', 'tip', 'service', 'zu zahlen', 'netto', 'brutto'
    ]
    
    // Calculate weighted scores
    let bankScore = 0
    let receiptScore = 0
    
    bankKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // Give higher weight to more specific terms
        if (['kontoauszug', 'kontostand', 'buchung', 'transaktion'].includes(keyword)) {
          bankScore += 3
        } else if (['überweisung', 'lastschrift', 'gutschrift'].includes(keyword)) {
          bankScore += 2
        } else {
          bankScore += 1
        }
      }
    })
    
    receiptKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // Give higher weight to more specific terms
        if (['rechnung', 'rechnungsnummer', 'mwst', 'umsatzsteuer'].includes(keyword)) {
          receiptScore += 3
        } else if (['beleg', 'quittung', 'invoice', 'receipt'].includes(keyword)) {
          receiptScore += 2
        } else {
          receiptScore += 1
        }
      }
    })
    
    console.log('Document type detection scores:', { 
      bankScore, 
      receiptScore, 
      text: lowerText.substring(0, 100),
      detectedType: bankScore > receiptScore ? 'bank-statement' : receiptScore > bankScore ? 'receipt' : 'bank-statement (default)'
    })
    
    if (bankScore > receiptScore) {
      console.log('Detected as bank statement')
      return 'bank-statement'
    } else if (receiptScore > bankScore) {
      console.log('Detected as receipt')
      return 'receipt'
    }
    
    console.log('Could not determine document type, defaulting to bank statement for safety')
    return 'bank-statement' // Default to bank statement instead of null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFileError('')
    if (files.length === 0) return
    const validFiles: FileUploadStatus[] = []
    const invalidFiles: string[] = []
    files.forEach(file => {
      if (!isValidFileType(file)) {
        invalidFiles.push(file.name)
      } else if (!isValidFileSize(file, 10)) {
        invalidFiles.push(file.name)
      } else {
        validFiles.push({ file, status: 'pending' })
      }
    })
    if (invalidFiles.length > 0) {
      setFileError(language === 'de'
        ? `Ungültige Dateien: ${invalidFiles.join(', ')}. Bitte verwenden Sie JPEG, JPG, PNG oder BMP.`
        : `Invalid files: ${invalidFiles.join(', ')}. Please use JPEG, JPG, PNG or BMP.`)
    }
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
      setDocumentType(null)
      setDetectedType(null)
      setExtractedText('')
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    setFileError('')
    if (files.length === 0) return
    const validFiles: FileUploadStatus[] = []
    const invalidFiles: string[] = []
    files.forEach(file => {
      if (!isValidFileType(file)) {
        invalidFiles.push(file.name)
      } else if (!isValidFileSize(file, 10)) {
        invalidFiles.push(file.name)
      } else {
        validFiles.push({ file, status: 'pending' })
      }
    })
    if (invalidFiles.length > 0) {
      setFileError(language === 'de'
        ? `Ungültige Dateien: ${invalidFiles.join(', ')}. Bitte verwenden Sie JPEG, JPG, PNG oder BMP.`
        : `Invalid files: ${invalidFiles.join(', ')}. Please use JPEG, JPG, PNG or BMP.`)
    }
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
      setDocumentType(null)
      setDetectedType(null)
      setExtractedText('')
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const processFileWithOpenAI = async (fileStatus: FileUploadStatus): Promise<AccountingRecord[]> => {
    const file = fileStatus.file
    console.log('Starting OpenAI Vision processing for:', file.name)
    console.log('File size:', file.size, 'bytes')
    
    let base64Image: string
    let detectedDocType = detectedType
    
    try {
      base64Image = await convertFileToBase64(file)
      console.log('File converted to base64, length:', base64Image.length)
    } catch (error) {
      console.error('Error converting file to base64:', error)
      throw new Error(language === 'de'
        ? 'Datei-Konvertierung fehlgeschlagen. Bitte versuchen Sie es mit einer anderen Datei.'
        : 'File conversion failed. Please try with a different file.')
    }
    
    if (!detectedDocType) {
      // For images, use Tesseract for detection
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(language === 'de' ? 'deu+eng' : 'eng+deu')
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()
      
      detectedDocType = detectDocumentType(text)
      setDetectedType(detectedDocType)
      setDocumentType(detectedDocType)
    }
    
    console.log('Using detected document type:', detectedDocType)
    
    const requestBody = {
      imageBase64: base64Image,
      documentType: detectedDocType,
      language: language,
    }
    
    console.log('Sending request to API')
    
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()
    console.log('API response status:', response.status)
    console.log('API response:', result)

    if (!response.ok) {
      if (result.code === 'MISSING_API_KEY') {
        throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.')
      } else if (result.code === 'INVALID_API_KEY') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.')
      } else if (result.code === 'QUOTA_EXCEEDED') {
        throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing.')
      } else if (result.code === 'RATE_LIMIT') {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a few moments.')
      } else {
        throw new Error(result.error || `OpenAI API error: ${response.status}`)
      }
    }

    if (result.success) {
      let parsedData: AccountingRecord[] = []
      
      if (result.data) {
        console.log('OpenAI returned structured data:', result.data)
        parsedData = processOCRResponse(result.data, detectedDocType || 'receipt')
      } else {
        console.log('No structured data, falling back to text processing')
        console.log('Raw text for processing:', result.rawText)
        parsedData = extractFinancialData(result.rawText, detectedDocType || 'receipt')
      }
      
      console.log('Final parsed data:', parsedData)
      console.log('Parsed data length:', parsedData.length)
      
      if (parsedData.length === 0) {
        throw new Error(translations[language].noDataFound)
      }
      
      return parsedData
    } else {
      throw new Error(result.error || 'Unknown error')
    }
  }

  const processFileWithTesseract = async (fileStatus: FileUploadStatus): Promise<AccountingRecord[]> => {
    const file = fileStatus.file
    console.log('Starting Tesseract OCR processing for:', file.name)
    
    try {
      let text = ''
      
      text = await convertFileToBase64(file)
      console.log('File converted to base64, length:', text.length)
      
      if (!text || text.trim().length === 0) {
        throw new Error(language === 'de' 
          ? 'Kein Text aus der Datei extrahiert. Bitte versuchen Sie es mit einer anderen Datei.'
          : 'No text extracted from file. Please try with a different file.')
      }
      
      // Detect document type
      const detectedDocType = detectDocumentType(text)
      setDetectedType(detectedDocType)
      setDocumentType(detectedDocType)
      
      // Extract financial data
      const extractedData = extractFinancialData(text, detectedDocType || 'receipt')
      
      if (extractedData.length === 0) {
        throw new Error(translations[language].noDataFound)
      }
      
      return extractedData
      
    } catch (error) {
      console.error('Tesseract OCR error:', error)
      throw error
    }
  }

  const processFile = async (fileStatus: FileUploadStatus): Promise<AccountingRecord[]> => {
    if (processingMethod === 'openai') {
      return await processFileWithOpenAI(fileStatus)
    } else {
      return await processFileWithTesseract(fileStatus)
    }
  }

  const processAllFiles = async () => {
    if (selectedFiles.length === 0) return
    
    setIsProcessing(true)
    const allData: AccountingRecord[] = []
    
    try {
      console.log(`Starting to process ${selectedFiles.length} files...`)
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileStatus = selectedFiles[i]
        console.log(`Processing file ${i + 1}/${selectedFiles.length}: ${fileStatus.file.name}`)
        
        // Update status to processing
        setSelectedFiles(prev => prev.map((fs, index) => 
          index === i ? { ...fs, status: 'processing' as const } : fs
        ))
        
        try {
          const extractedData = await processFile(fileStatus)
          console.log(`File ${fileStatus.file.name} processed successfully. Extracted ${extractedData.length} records:`, extractedData)
          console.log(`File ${fileStatus.file.name} data validation:`, {
            isArray: Array.isArray(extractedData),
            length: extractedData.length,
            hasData: extractedData.length > 0,
            firstRecord: extractedData[0]
          })
          
          // Update status to completed
          setSelectedFiles(prev => prev.map((fs, index) => 
            index === i ? { 
              ...fs, 
              status: 'completed' as const, 
              extractedData,
              progress: 100
            } : fs
          ))
          
          // Add to all data
          if (Array.isArray(extractedData)) {
            if (extractedData.length > 0) {
              allData.push(...extractedData)
              console.log(`File ${fileStatus.file.name} added ${extractedData.length} records. Total data collected so far: ${allData.length} records`)
            } else {
              console.log(`File ${fileStatus.file.name} processed but no valid data extracted`)
            }
          } else {
            console.error('Extracted data is not an array:', extractedData)
          }
          
        } catch (error) {
          console.error(`Error processing file ${fileStatus.file.name}:`, error)
          
          // Update status to error
          setSelectedFiles(prev => prev.map((fs, index) => 
            index === i ? { 
              ...fs, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Unknown error'
            } : fs
          ))
        }
      }
      
      console.log(`All files processed. Final data array:`, allData)
      console.log(`Total records collected: ${allData.length}`)
      console.log('Data breakdown by file:')
      selectedFiles.forEach((fileStatus, index) => {
        if (fileStatus.extractedData) {
          console.log(`  File ${index + 1} (${fileStatus.file.name}): ${fileStatus.extractedData.length} records`)
        }
      })
      
      // Final validation and cleanup of data - relaxed validation
      const finalData = allData.filter(record => {
        const isValid = record && record.betrag !== 0 && record.beschreibung
        if (!isValid) {
          console.log('Filtering out invalid record:', record)
        }
        return isValid
      })
      
      console.log(`Final validated data: ${finalData.length} records`)
      
      // Update all extracted data
      setAllExtractedData(finalData)
      
      // Call the callback with all data
      if (finalData.length > 0) {
        console.log('Calling onDataExtracted with final validated data:', finalData)
        console.log('Data structure check:', {
          isArray: Array.isArray(finalData),
          length: finalData.length,
          firstRecord: finalData[0],
          lastRecord: finalData[finalData.length - 1]
        })
        onDataExtracted(finalData)
      } else {
        console.log('No valid data collected from any files')
      }
      
    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setSelectedFiles([])
    setAllExtractedData([])
    setExtractedText('')
    setFileError('')
  }

  const getStatusIcon = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return <FileImage className="h-4 w-4 text-gray-400" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return language === 'de' ? 'Ausstehend' : 'Pending'
      case 'processing':
        return language === 'de' ? 'Verarbeitung...' : 'Processing...'
      case 'completed':
        return language === 'de' ? 'Abgeschlossen' : 'Completed'
      case 'error':
        return language === 'de' ? 'Fehler' : 'Error'
    }
  }

  const UploadArea = () => (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{translations[language].uploadTitle}</h3>
      <p className="text-gray-600 mb-4">{translations[language].uploadSubtitle}</p>
      <div className="text-sm text-gray-500 space-y-1">
        <p>{translations[language].supportedFormats}</p>
        <p>{translations[language].maxSize}</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpeg,.jpg,.png,.bmp"
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{translations[language].multipleFiles}</h2>
      
      {/* Upload Area */}
      <UploadArea />

      {/* Error Display */}
      {fileError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{fileError}</p>
        </div>
      )}

      {/* Processing Method Selection */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{translations[language].processingMethod}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="processingMethod"
                value="openai"
                checked={processingMethod === 'openai'}
                onChange={(e) => setProcessingMethod(e.target.value as 'openai' | 'tesseract')}
                className="mr-3"
              />
              <div>
                <div className="flex items-center">
                  <Brain className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium">{translations[language].openai}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[language].highestAccuracy}
                </p>
              </div>
            </label>
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="processingMethod"
                value="tesseract"
                checked={processingMethod === 'tesseract'}
                onChange={(e) => setProcessingMethod(e.target.value as 'openai' | 'tesseract')}
                className="mr-3"
              />
              <div>
                <div className="flex items-center">
                  <FileImage className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium">{translations[language].tesseract}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[language].localProcessing}
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {translations[language].uploadMultiple} ({selectedFiles.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={processAllFiles}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isProcessing 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                    {translations[language].processingFiles}
                  </>
                ) : (
                  translations[language].process
                )}
              </button>
              <button
                onClick={clearAllFiles}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {translations[language].clearAll}
              </button>
            </div>
          </div>

          {/* File Status List */}
          <div className="space-y-2">
            {selectedFiles.map((fileStatus, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(fileStatus.status)}
                  <div>
                    <p className="font-medium text-gray-900">{fileStatus.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm px-2 py-1 rounded ${
                    fileStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                    fileStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                    fileStatus.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(fileStatus.status)}
                  </span>
                  {fileStatus.status === 'error' && (
                    <span className="text-sm text-red-600 max-w-xs truncate">
                      {fileStatus.error}
                    </span>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {allExtractedData.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900">
                    {translations[language].successfulFiles}: {selectedFiles.filter(f => f.status === 'completed').length}
                  </h4>
                  <p className="text-sm text-green-700">
                    {translations[language].totalFiles}: {selectedFiles.length} | 
                    {translations[language].failedFiles}: {selectedFiles.filter(f => f.status === 'error').length}
                  </p>
                  <p className="text-sm text-green-700">
                    {language === 'de' ? 'Extrahierte Datensätze' : 'Extracted records'}: {allExtractedData.length}
                  </p>
                  <p className="text-sm text-green-700">
                    {language === 'de' ? 'Dateien mit Daten' : 'Files with data'}: {selectedFiles.filter(f => f.extractedData && f.extractedData.length > 0).length}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      console.log('Download button clicked. Current data:', allExtractedData)
                      console.log('Data breakdown:', selectedFiles.map(f => ({
                        name: f.file.name,
                        status: f.status,
                        dataLength: f.extractedData?.length || 0
                      })))
                      onDataExtracted(allExtractedData)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {translations[language].downloadAll}
                  </button>
                  <button
                    onClick={() => {
                      console.log('=== DEBUG DATA ===')
                      console.log('All extracted data:', allExtractedData)
                      console.log('Selected files:', selectedFiles.map(f => ({
                        name: f.file.name,
                        status: f.status,
                        extractedData: f.extractedData
                      })))
                      console.log('Completed files:', selectedFiles.filter(f => f.status === 'completed'))
                      console.log('Files with data:', selectedFiles.filter(f => f.extractedData && f.extractedData.length > 0))
                      
                      // Manually accumulate data from all completed files
                      const manualData: AccountingRecord[] = []
                      selectedFiles.forEach(fileStatus => {
                        if (fileStatus.status === 'completed' && fileStatus.extractedData) {
                          manualData.push(...fileStatus.extractedData)
                        }
                      })
                      console.log('Manually accumulated data:', manualData)
                      console.log('Manual data length:', manualData.length)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Debug
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">{translations[language].tipsTitle}</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">{translations[language].tipsReceiptsTitle}</h4>
            <ul className="space-y-1">
              <li>• {translations[language].tipsReceipts1}</li>
              <li>• {translations[language].tipsReceipts2}</li>
              <li>• {translations[language].tipsReceipts3}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">{translations[language].tipsBankTitle}</h4>
            <ul className="space-y-1">
              <li>• {translations[language].tipsBank1}</li>
              <li>• {translations[language].tipsBank2}</li>
              <li>• {translations[language].tipsBank3}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 