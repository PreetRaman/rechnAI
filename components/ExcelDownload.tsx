'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { AccountingRecord, generateExcelColumns, convertToExcelData, downloadCSV } from '@/utils/dataProcessing'
import * as XLSX from 'xlsx'

interface ExcelDownloadProps {
  data: AccountingRecord[]
  language: 'de' | 'en'
}

const translations = {
  de: {
    title: 'Excel Export',
    subtitle: 'Laden Sie die Daten als Excel-Datei herunter',
    noData: 'Keine Daten zum Exportieren',
    uploadFirst: 'Laden Sie zuerst ein Dokument hoch',
    download: 'Excel herunterladen',
    downloadSuccess: 'Excel-Datei erfolgreich heruntergeladen',
    downloadError: 'Fehler beim Herunterladen der Excel-Datei',
    processing: 'Excel-Datei wird erstellt...',
    records: 'Datensätze',
    totalAmount: 'Gesamtbetrag',
    excelButton: 'Excel (.xlsx)',
    csvButton: 'CSV (.csv)',
    noDataAlert: 'Keine Daten zum Exportieren.',
    excelError: 'Fehler beim Erstellen der Excel-Datei. Bitte versuchen Sie es erneut.',
    csvError: 'Fehler beim Erstellen der CSV-Datei. Bitte versuchen Sie es erneut.',
    columns: {
      datum: 'Datum',
      betrag: 'Betrag',
      beschreibung: 'Beschreibung',
      kategorie: 'Kategorie',
      rechnungsnummer: 'Rechnungsnummer',
      unternehmen: 'Unternehmen',
      mwst_betrag: 'MWST-Betrag',
      mwst_satz: 'MWST-Satz',
      verwendungszweck: 'Verwendungszweck',
      gegenkonto: 'Gegenkonto',
      transaktionstyp: 'Transaktionstyp',
      valuta: 'Valuta',
      betrag_brutto: 'Betrag Brutto',
      betrag_netto: 'Betrag Netto'
    }
  },
  en: {
    title: 'Excel Export',
    subtitle: 'Download data as Excel file',
    noData: 'No data to export',
    uploadFirst: 'Please upload a document first',
    download: 'Download Excel',
    downloadSuccess: 'Excel file downloaded successfully',
    downloadError: 'Error downloading Excel file',
    processing: 'Creating Excel file...',
    records: 'Records',
    totalAmount: 'Total Amount',
    excelButton: 'Excel (.xlsx)',
    csvButton: 'CSV (.csv)',
    noDataAlert: 'No data to export.',
    excelError: 'Error generating Excel file. Please try again.',
    csvError: 'Error generating CSV file. Please try again.',
    columns: {
      datum: 'Date',
      betrag: 'Amount',
      beschreibung: 'Description',
      kategorie: 'Category',
      rechnungsnummer: 'Invoice Number',
      unternehmen: 'Company',
      mwst_betrag: 'VAT Amount',
      mwst_satz: 'VAT Rate',
      verwendungszweck: 'Purpose',
      gegenkonto: 'Counter Account',
      transaktionstyp: 'Transaction Type',
      valuta: 'Value Date',
      betrag_brutto: 'Gross Amount',
      betrag_netto: 'Net Amount'
    }
  }
}

export default function ExcelDownload({ data, language }: ExcelDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateExcel = async () => {
    if (data.length === 0) {
      alert(translations[language].noDataAlert)
      return
    }

    setIsGenerating(true)
    try {
      console.log('Generating Excel with data:', data)
      
      const columns = generateExcelColumns(data)
      console.log('Generated columns:', columns)
      
      const excelData = convertToExcelData(data, columns)
      console.log('Excel data:', excelData)
      
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet([columns, ...excelData])
      
      const colWidths = columns.map(col => ({ wch: Math.max(col.length, 12) }))
      worksheet['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Data')
      
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const finalFilename = `RechnAI_${timestamp}.xlsx`
      
      XLSX.writeFile(workbook, finalFilename)
      
      console.log('Excel file generated successfully:', finalFilename)
      
    } catch (error) {
      console.error('Error generating Excel file:', error)
      alert(translations[language].excelError)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCSV = async () => {
    if (data.length === 0) {
      alert(translations[language].noDataAlert)
      return
    }

    setIsGenerating(true)
    try {
      console.log('Generating CSV with data:', data)
      
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const finalFilename = `RechnAI_${timestamp}.csv`
      
      downloadCSV(data, finalFilename)
      
      console.log('CSV file generated successfully:', finalFilename)
      
    } catch (error) {
      console.error('Error generating CSV file:', error)
      alert(translations[language].csvError)
    } finally {
      setIsGenerating(false)
    }
  }

  const totalAmount = data.reduce((sum, record) => sum + record.betrag, 0)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {translations[language].title}
        </h3>
        <p className="text-gray-600">
          {translations[language].subtitle}
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-900">{data.length}</div>
            <div className="text-sm text-blue-700">{translations[language].records}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-sm text-blue-700">{translations[language].totalAmount}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={generateExcel}
          disabled={isGenerating || data.length === 0}
          className={`flex items-center justify-center p-4 rounded-lg font-medium transition-colors ${
            isGenerating || data.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <FileSpreadsheet className="h-5 w-5 mr-2" />
          )}
          {translations[language].excelButton}
        </button>

        <button
          onClick={generateCSV}
          disabled={isGenerating || data.length === 0}
          className={`flex items-center justify-center p-4 rounded-lg font-medium transition-colors ${
            isGenerating || data.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <FileText className="h-5 w-5 mr-2" />
          )}
          {translations[language].csvButton}
        </button>
      </div>

      {data.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800 text-sm">
            {translations[language].uploadFirst}
          </p>
        </div>
      )}
    </div>
  )
} 