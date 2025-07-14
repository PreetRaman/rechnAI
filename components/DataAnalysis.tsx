'use client'

import { useState, useEffect } from 'react'
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react'
import { AccountingRecord } from '@/utils/dataProcessing'

interface DataAnalysisProps {
  data: AccountingRecord[]
  onDataChange: (data: AccountingRecord[]) => void
  language: 'de' | 'en'
}

const translations = {
  de: {
    title: 'Datenanalyse',
    subtitle: 'Überprüfen und bearbeiten Sie die extrahierten Daten',
    noData: 'Keine Daten zum Anzeigen',
    uploadFirst: 'Laden Sie zuerst ein Dokument hoch',
    totalRecords: 'Gesamtanzahl',
    totalAmount: 'Gesamtbetrag',
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
    },
    actions: {
      edit: 'Bearbeiten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      add: 'Hinzufügen'
    }
  },
  en: {
    title: 'Data Analysis',
    subtitle: 'Review and edit extracted data',
    noData: 'No data to display',
    uploadFirst: 'Please upload a document first',
    totalRecords: 'Total Records',
    totalAmount: 'Total Amount',
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
    },
    actions: {
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      add: 'Add'
    }
  }
}

export default function DataAnalysis({ data, onDataChange, language }: DataAnalysisProps) {
  const [editableData, setEditableData] = useState<AccountingRecord[]>(data)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const t = translations[language]

  useEffect(() => {
    console.log('DataAnalysis useEffect - data prop changed:', data)
    setEditableData(data)
  }, [data])

  const categories = [
    'Wareneingang',
    'Wareneingang 7%',
    'Wareneingang 19%',
    'Betriebsausgaben',
    'Betriebsausgaben 7%',
    'Betriebsausgaben 19%',
    'Personalkosten',
    'Miete & Pacht',
    'Versicherungen',
    'Energiekosten',
    'Telekommunikation',
    'Fahrzeugkosten',
    'Reisekosten',
    'Verpflegung',
    'Bürobedarf',
    'Fortbildung',
    'Marketing',
    'Einnahmen',
    'Zinsen',
    'Steuern',
    'Sonstige'
  ]

  const handleEdit = (index: number) => {
    setEditingIndex(index)
  }

  const handleSave = (index: number) => {
    setEditingIndex(null)
    onDataChange(editableData)
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditableData(data)
  }

  const handleUpdateField = (index: number, field: keyof AccountingRecord, value: string | number) => {
    setEditableData(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleDelete = (index: number) => {
    const newData = editableData.filter((_, i) => i !== index)
    setEditableData(newData)
    onDataChange(newData)
  }

  const handleAddRow = () => {
    const newRow: AccountingRecord = {
      datum: '',
      betrag: 0,
      beschreibung: '',
      kategorie: 'Sonstige'
    }
    const newData = [...editableData, newRow]
    setEditableData(newData)
    onDataChange(newData)
  }

  const totalAmount = editableData.reduce((sum, item) => sum + item.betrag, 0)

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t.noData}</p>
        <p className="text-sm text-gray-400 mt-2">{t.uploadFirst}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-600 font-medium">{t.totalRecords}</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">{editableData.length}</p>
        </div>
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-green-600 font-medium">{t.totalAmount}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-900">
            {totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.datum}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.betrag}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.beschreibung}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.kategorie}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.rechnungsnummer}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.unternehmen}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.mwst_betrag}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.mwst_satz}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.verwendungszweck}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.gegenkonto}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.transaktionstyp}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.betrag_brutto}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.columns.betrag_netto}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.actions.edit}</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-900">{t.actions.delete}</th>
            </tr>
          </thead>
          <tbody>
            {editableData.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.datum}
                      onChange={(e) => handleUpdateField(index, 'datum', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.datum
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="number"
                      step="0.01"
                      value={record.betrag}
                      onChange={(e) => handleUpdateField(index, 'betrag', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.beschreibung}
                      onChange={(e) => handleUpdateField(index, 'beschreibung', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.beschreibung
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <select
                      value={record.kategorie}
                      onChange={(e) => handleUpdateField(index, 'kategorie', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    record.kategorie
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.rechnungsnummer || ''}
                      onChange={(e) => handleUpdateField(index, 'rechnungsnummer', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.rechnungsnummer || ''
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.unternehmen || ''}
                      onChange={(e) => handleUpdateField(index, 'unternehmen', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.unternehmen || ''
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="number"
                      step="0.01"
                      value={record.mwst_betrag || 0}
                      onChange={(e) => handleUpdateField(index, 'mwst_betrag', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    (record.mwst_betrag || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="number"
                      step="0.01"
                      value={record.mwst_satz || 0}
                      onChange={(e) => handleUpdateField(index, 'mwst_satz', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    `${(record.mwst_satz || 0)}%`
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.verwendungszweck || ''}
                      onChange={(e) => handleUpdateField(index, 'verwendungszweck', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.verwendungszweck || ''
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.gegenkonto || ''}
                      onChange={(e) => handleUpdateField(index, 'gegenkonto', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.gegenkonto || ''
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.transaktionstyp || ''}
                      onChange={(e) => handleUpdateField(index, 'transaktionstyp', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    record.transaktionstyp || ''
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="number"
                      step="0.01"
                      value={record.betrag_brutto || 0}
                      onChange={(e) => handleUpdateField(index, 'betrag_brutto', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    (record.betrag_brutto || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  {editingIndex === index ? (
                    <input
                      type="number"
                      step="0.01"
                      value={record.betrag_netto || 0}
                      onChange={(e) => handleUpdateField(index, 'betrag_netto', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  ) : (
                    (record.betrag_netto || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  )}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2">
                  <div className="flex space-x-2">
                    {editingIndex === index ? (
                      <>
                        <button
                          onClick={() => handleSave(index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2">
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {editableData.map((record, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={record.datum}
                        onChange={(e) => handleUpdateField(index, 'datum', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      record.datum
                    )}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        step="0.01"
                        value={record.betrag}
                        onChange={(e) => handleUpdateField(index, 'betrag', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      record.betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    )}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={record.beschreibung}
                      onChange={(e) => handleUpdateField(index, 'beschreibung', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Beschreibung"
                    />
                  ) : (
                    record.beschreibung
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">{t.columns.kategorie}:</span>{' '}
                  {editingIndex === index ? (
                    <select
                      value={record.kategorie}
                      onChange={(e) => handleUpdateField(index, 'kategorie', e.target.value)}
                      className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    record.kategorie
                  )}
                </div>
              </div>
              <div className="flex space-x-1 ml-2">
                {editingIndex === index ? (
                  <>
                    <button
                      onClick={() => handleSave(index)}
                      className="text-green-600 hover:text-green-800 p-1"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-gray-600 hover:text-gray-800 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={handleAddRow}
          className="flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.actions.add}
        </button>
      </div>
    </div>
  )
} 