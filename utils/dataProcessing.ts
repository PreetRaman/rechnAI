export interface AccountingRecord {
  datum: string
  betrag: number
  beschreibung: string
  kategorie: string
  subkategorie?: string
  rechnungsnummer?: string
  unternehmen?: string
  mwst_betrag?: number
  mwst_satz?: number
  verwendungszweck?: string
  gegenkonto?: string
  transaktionstyp?: string
  valuta?: string
  betrag_brutto?: number
  betrag_netto?: number
}

// Interface definitions for OpenAI responses
interface OpenAIReceiptResponse {
  rechnungsnummer?: string
  datum?: string  // Updated to match OCR response
  betrag_brutto?: number  // Updated to number type
  betrag_netto?: number   // Updated to number type
  mwst_betrag?: number    // Updated to number type
  mwst_satz?: number      // Updated to number type
  unternehmen?: string
  beschreibung?: string
  kategorie?: string
  // Legacy fields for backward compatibility
  date?: string
  total_sum?: string
  net_amount?: string
  vat_tax?: string
  vat_rate?: string
  vendor_name?: string
}

interface OpenAIBankStatementTransaction {
  datum?: string
  valuta?: string
  betrag?: number  // Updated to number type
  verwendungszweck?: string
  gegenkonto?: string
  transaktionstyp?: string
  kategorie?: string
  // Legacy fields for backward compatibility
  date?: string
  description?: string
  credit?: string
  debit?: string
  balance?: string
  account_number?: string
  iban?: string
  bic?: string
  booking_text?: string
}

interface OpenAIBankStatementResponse {
  transactions?: OpenAIBankStatementTransaction[]
  // For single transaction responses
  datum?: string
  valuta?: string
  betrag?: number
  verwendungszweck?: string
  gegenkonto?: string
  transaktionstyp?: string
  kategorie?: string
  account_info?: string
  period?: string
}

export const parseAmount = (amount: string): number => {
  // Remove currency symbols and commas, then parse as float
  // Handle German number format (comma as decimal separator)
  let cleaned = amount.replace(/[€£$\s]/g, '')
  
  // Handle German number format: 1.234,56 -> 1234.56
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Format: 1.234,56 (German)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    // Check if comma is decimal separator (German) or thousands separator
    const parts = cleaned.split(',')
    if (parts[1] && parts[1].length <= 2) {
      // Likely decimal separator
      cleaned = cleaned.replace(',', '.')
    } else {
      // Likely thousands separator
      cleaned = cleaned.replace(/,/g, '')
    }
  }
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export const parseCredit = (credit: string): number => {
  return parseAmount(credit)
}

export const parseDebit = (debit: string): number => {
  return parseAmount(debit)
}

export const parseBalance = (balance: string): number => {
  return parseAmount(balance)
}

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export const validateDate = (date: string): boolean => {
  // Check for common date formats including German format
  const datePatterns = [
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/, // MM/DD/YYYY or MM-DD-YYYY
    /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/, // YYYY/MM/DD or YYYY-MM-DD
    /^\d{1,2}\.\d{1,2}\.\d{2,4}$/, // DD.MM.YYYY (German)
    /^\d{1,2}\.\d{1,2}\.\d{2}$/, // DD.MM.YY (German short)
    /^\d{2}\.\d{2}\.\d{4}$/ // DD.MM.YYYY (German strict)
  ]
  
  return datePatterns.some(pattern => pattern.test(date))
}

export const categorizeTransaction = (description: string, documentType?: 'bank-statement' | 'receipt'): string => {
  const lowerDesc = description.toLowerCase()
  
  // German-specific categories for tax compliance
  const categories = {
    'Wareneingang': ['wareneingang', 'einkauf', 'beschaffung', 'material', 'rohstoffe', 'waren', 'inventar'],
    'Wareneingang 7%': ['lebensmittel', 'nahrungsmittel', 'getränke', 'supermarkt', 'bäckerei', 'metzgerei', 'obst', 'gemüse'],
    'Wareneingang 19%': ['elektronik', 'technik', 'computer', 'software', 'hardware', 'büroausstattung', 'möbel'],
    'Betriebsausgaben': ['büro', 'geschäftsausgaben', 'betriebskosten', 'geschäftsbedarf', 'dienstleistungen'],
    'Betriebsausgaben 19%': ['beratung', 'rechtsanwalt', 'steuerberater', 'buchhalter', 'werbung', 'marketing'],
    'Betriebsausgaben 7%': ['transport', 'lieferung', 'versand', 'logistik'],
    'Personalkosten': ['gehalt', 'lohn', 'sozialabgaben', 'krankenversicherung', 'rentenversicherung', 'arbeitslosenversicherung'],
    'Miete & Pacht': ['miete', 'pacht', 'leasing', 'immobilie', 'büroraum', 'lager', 'werkstatt'],
    'Versicherungen': ['versicherung', 'haftpflicht', 'betriebshaftpflicht', 'sachversicherung', 'rechtschutz'],
    'Energiekosten': ['strom', 'gas', 'wasser', 'heizung', 'energie', 'versorgung'],
    'Telekommunikation': ['telefon', 'internet', 'mobilfunk', 'dsl', 'festnetz', 'handy'],
    'Fahrzeugkosten': ['tankstelle', 'benzin', 'diesel', 'kraftstoff', 'parkplatz', 'maut', 'versicherung'],
    'Reisekosten': ['hotel', 'übernachtung', 'flug', 'bahn', 'db', 'deutsche bahn', 'ticket', 'reise'],
    'Verpflegung': ['restaurant', 'café', 'imbiss', 'gastronomie', 'verpflegung', 'mahlzeit'],
    'Bürobedarf': ['papier', 'drucker', 'toner', 'büromaterial', 'schreibwaren', 'ordner'],
    'Fortbildung': ['schulung', 'seminar', 'fortbildung', 'weiterbildung', 'kurs', 'training'],
    'Marketing': ['werbung', 'marketing', 'pr', 'public relations', 'plakat', 'flyer', 'website'],
    'Einnahmen': ['umsatz', 'einnahmen', 'erlös', 'verkauf', 'rechnung', 'zahlung', 'überweisung'],
    'Zinsen': ['zinsen', 'habenzinsen', 'sollzinsen', 'kreditzinsen'],
    'Steuern': ['mwst', 'umsatzsteuer', 'vorsteuer', 'steuer', 'finanzamt', 'steuerbescheid'],
    'Sonstige': ['diverses', 'sonstiges', 'andere', 'misc', 'various']
  }
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category
    }
  }
  
  return documentType === 'receipt' ? 'Betriebsausgaben' : 'Sonstige'
}

export const getSubCategory = (description: string, category: string, documentType?: 'bank-statement' | 'receipt'): string => {
  const lowerDesc = description.toLowerCase()
  
  // Sub-categories for different main categories
  const subCategories = {
    'Wareneingang': {
      'Rohstoffe': ['rohstoffe', 'material', 'grundstoffe'],
      'Handelswaren': ['handelswaren', 'waren', 'produkte'],
      'Verpackung': ['verpackung', 'karton', 'folie'],
      'Hilfsstoffe': ['hilfsstoffe', 'chemikalien', 'zusätze']
    },
    'Wareneingang 7%': {
      'Lebensmittel': ['lebensmittel', 'nahrungsmittel', 'essen', 'trinken'],
      'Getränke': ['getränke', 'wasser', 'saft', 'kaffee'],
      'Frische Produkte': ['obst', 'gemüse', 'frisch', 'bio']
    },
    'Wareneingang 19%': {
      'Elektronik': ['elektronik', 'computer', 'laptop', 'tablet', 'smartphone'],
      'Software': ['software', 'programm', 'app', 'lizenz'],
      'Büroausstattung': ['büroausstattung', 'möbel', 'stuhl', 'tisch'],
      'Technik': ['technik', 'hardware', 'gerät', 'maschine']
    },
    'Betriebsausgaben': {
      'Bürobedarf': ['bürobedarf', 'papier', 'drucker', 'toner'],
      'Dienstleistungen': ['dienstleistungen', 'service', 'wartung'],
      'Beratung': ['beratung', 'consulting', 'experte'],
      'Geschäftsbedarf': ['geschäftsbedarf', 'bedarf', 'zubehör']
    },
    'Betriebsausgaben 19%': {
      'Rechtsberatung': ['rechtsanwalt', 'anwalt', 'rechtsberatung'],
      'Steuerberatung': ['steuerberater', 'buchhalter', 'steuerberatung'],
      'Werbung': ['werbung', 'marketing', 'pr', 'public relations'],
      'Beratung': ['beratung', 'consulting', 'experte']
    },
    'Betriebsausgaben 7%': {
      'Transport': ['transport', 'lieferung', 'versand', 'spedition'],
      'Logistik': ['logistik', 'lager', 'warehouse'],
      'Kurier': ['kurier', 'express', 'dhl', 'ups']
    },
    'Verpflegung': {
      'Restaurant': ['restaurant', 'gastronomie', 'imbiss'],
      'Café': ['café', 'kaffee', 'bäckerei'],
      'Hotel': ['hotel', 'übernachtung', 'frühstück'],
      'Catering': ['catering', 'verpflegung', 'mahlzeit']
    },
    'Fahrzeugkosten': {
      'Kraftstoff': ['kraftstoff', 'benzin', 'diesel', 'tankstelle'],
      'Parken': ['parken', 'parkplatz', 'parkhaus'],
      'Versicherung': ['versicherung', 'kfz', 'auto'],
      'Wartung': ['wartung', 'reparatur', 'werkstatt']
    },
    'Reisekosten': {
      'Hotel': ['hotel', 'übernachtung', 'unterkunft'],
      'Transport': ['transport', 'bahn', 'flug', 'bus'],
      'Verpflegung': ['verpflegung', 'essen', 'mahlzeit'],
      'Sonstiges': ['sonstiges', 'diverses', 'andere']
    },
    'Telekommunikation': {
      'Internet': ['internet', 'dsl', 'wlan', 'wifi'],
      'Telefon': ['telefon', 'festnetz', 'handy', 'mobilfunk'],
      'Software': ['software', 'app', 'programm'],
      'Hardware': ['hardware', 'router', 'modem']
    },
    'Energiekosten': {
      'Strom': ['strom', 'elektrizität', 'elektro'],
      'Gas': ['gas', 'heizung', 'wärme'],
      'Wasser': ['wasser', 'abwasser', 'versorgung'],
      'Sonstiges': ['sonstiges', 'diverses', 'andere']
    }
  }
  
  // Get sub-categories for the main category
  const categorySubs = subCategories[category as keyof typeof subCategories]
  if (categorySubs) {
    for (const [subCategory, keywords] of Object.entries(categorySubs)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return subCategory
      }
    }
  }
  
  // Default sub-categories based on document type
  if (documentType === 'receipt') {
    return 'Sonstiges'
  } else if (documentType === 'bank-statement') {
    return 'Banktransaktion'
  }
  
  return 'Sonstiges'
}

export const getTaxCategory = (category: string): string => {
  // Map categories to German tax categories
  const taxMapping: { [key: string]: string } = {
    'Wareneingang': 'WARENEINGANG',
    'Wareneingang 7%': 'WARENEINGANG_7',
    'Wareneingang 19%': 'WARENEINGANG_19',
    'Betriebsausgaben': 'BETRIEBSAUSGABEN',
    'Betriebsausgaben 7%': 'BETRIEBSAUSGABEN_7',
    'Betriebsausgaben 19%': 'BETRIEBSAUSGABEN_19',
    'Personalkosten': 'PERSONALKOSTEN',
    'Miete & Pacht': 'MIETE_PACHT',
    'Versicherungen': 'VERSICHERUNGEN',
    'Energiekosten': 'ENERGIEKOSTEN',
    'Telekommunikation': 'TELEKOM',
    'Fahrzeugkosten': 'FAHRZEUGKOSTEN',
    'Reisekosten': 'REISEKOSTEN',
    'Verpflegung': 'VERPFLEGUNG',
    'Bürobedarf': 'BUERO',
    'Fortbildung': 'FORTBILDUNG',
    'Marketing': 'MARKETING',
    'Einnahmen': 'EINNAHMEN',
    'Zinsen': 'ZINSEN',
    'Steuern': 'STEUERN',
    'Sonstige': 'SONSTIGE'
  }
  
  return taxMapping[category] || 'SONSTIGE'
}

export const cleanText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-.,$€£äöüßÄÖÜ]/g, '') // Remove special characters except German umlauts
    .trim()
}

export const extractFinancialData = (text: string, documentType?: 'receipt' | 'bank-statement'): AccountingRecord[] => {
  console.log('Extracting financial data from text:', text.substring(0, 200) + '...')
  console.log('Document type:', documentType)
  
  const records: AccountingRecord[] = []
  
  if (documentType === 'receipt') {
    return extractReceiptData(text)
  } else if (documentType === 'bank-statement') {
    return extractBankStatementData(text)
  } else {
    // Auto-detect document type
    const lowerText = text.toLowerCase()
    if (lowerText.includes('rechnung') || lowerText.includes('quittung') || lowerText.includes('beleg')) {
      console.log('Auto-detected as receipt')
      return extractReceiptData(text)
    } else if (lowerText.includes('kontoauszug') || lowerText.includes('bankauszug') || lowerText.includes('buchungsdatum')) {
      console.log('Auto-detected as bank statement')
      return extractBankStatementData(text)
    } else {
      console.log('Could not auto-detect, trying receipt extraction')
      return extractReceiptData(text)
    }
  }
}

const extractReceiptData = (text: string): AccountingRecord[] => {
  console.log('Extracting receipt data...')
  
  const records: AccountingRecord[] = []
  
  // Extract date
  const dateMatch = text.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/)
  const datum = dateMatch ? `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}` : ''
  
  // Extract amounts
  const amountMatches = text.match(/(\d+[.,]\d{2})/g)
  const amounts = amountMatches ? amountMatches.map(amt => parseFloat(amt.replace(',', '.'))) : []
  const betrag = amounts.length > 0 ? Math.max(...amounts) : 0
  
  // Extract company name (look for common patterns)
  const companyMatch = text.match(/([A-ZÄÖÜ][a-zäöüß\s&]+(?:GmbH|AG|KG|OHG|e\.V\.|UG))/)
  const unternehmen = companyMatch ? companyMatch[1].trim() : ''
  
  // Extract invoice number
  const invoiceMatch = text.match(/(?:Rechn\.?\s*Nr\.?|Invoice|Nr\.?)\s*[:#]?\s*([A-Z0-9\-_]+)/i)
  const rechnungsnummer = invoiceMatch ? invoiceMatch[1] : ''
  
  // Extract VAT
  const vatMatch = text.match(/(?:MWST|USt|Steuer)\s*[:=]?\s*(\d+[.,]\d{2})/i)
  const mwst_betrag = vatMatch ? parseFloat(vatMatch[1].replace(',', '.')) : 0
  
  // Determine category based on text content
  const lowerText = text.toLowerCase()
  let kategorie = 'Sonstiges'
  
  if (lowerText.includes('restaurant') || lowerText.includes('café') || lowerText.includes('imbiss')) {
    kategorie = 'Verpflegung'
  } else if (lowerText.includes('tank') || lowerText.includes('benzin') || lowerText.includes('diesel')) {
    kategorie = 'Fahrzeugkosten'
  } else if (lowerText.includes('büro') || lowerText.includes('papier') || lowerText.includes('drucker')) {
    kategorie = 'Betriebsausgaben'
  } else if (lowerText.includes('hotel') || lowerText.includes('übernachtung')) {
    kategorie = 'Reisekosten'
  }
  
  // Get sub-category
  const subkategorie = getSubCategory(lowerText, kategorie, 'receipt')
  
  const record: AccountingRecord = {
    datum,
    betrag,
    beschreibung: unternehmen || 'Beleg',
    kategorie,
    subkategorie,
    rechnungsnummer,
    unternehmen,
    mwst_betrag,
    mwst_satz: mwst_betrag > 0 ? 19 : 0, // Default to 19% if VAT found
    betrag_brutto: betrag,
    betrag_netto: mwst_betrag > 0 ? betrag - mwst_betrag : betrag
  }
  
  console.log('Extracted receipt record:', record)
  records.push(record)
  
  return records
}

const extractBankStatementData = (text: string): AccountingRecord[] => {
  console.log('Extracting bank statement data...')
  
  const records: AccountingRecord[] = []
  
  // Extract date
  const dateMatch = text.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/)
  const datum = dateMatch ? `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}` : ''
  
  // Extract amounts
  const amountMatches = text.match(/(\d+[.,]\d{2})/g)
  const amounts = amountMatches ? amountMatches.map(amt => parseFloat(amt.replace(',', '.'))) : []
  const betrag = amounts.length > 0 ? amounts[0] : 0 // Use first amount found
  
  // Extract description/purpose
  const lines = text.split('\n')
  let verwendungszweck = ''
  for (const line of lines) {
    if (line.length > 10 && !line.match(/^\d/) && !line.includes('EUR') && !line.includes('€')) {
      verwendungszweck = line.trim()
      break
    }
  }
  
  // Determine transaction type
  const lowerText = text.toLowerCase()
  let transaktionstyp = 'Überweisung'
  let kategorie = 'Banktransaktion'
  
  if (lowerText.includes('lastschrift')) {
    transaktionstyp = 'Lastschrift'
  } else if (lowerText.includes('gutschrift')) {
    transaktionstyp = 'Gutschrift'
  } else if (lowerText.includes('abhebung')) {
    transaktionstyp = 'Abhebung'
  }
  
  // Determine category
  if (lowerText.includes('gehalt') || lowerText.includes('lohn')) {
    kategorie = 'Einnahmen'
  } else if (lowerText.includes('miete') || lowerText.includes('miet')) {
    kategorie = 'Miete & Pacht'
  } else if (lowerText.includes('gebühr') || lowerText.includes('gebühren')) {
    kategorie = 'Betriebsausgaben'
  }
  
  // Get sub-category
  const subkategorie = getSubCategory(lowerText, kategorie, 'bank-statement')
  
  const record: AccountingRecord = {
    datum,
    betrag,
    beschreibung: verwendungszweck || 'Banktransaktion',
    kategorie,
    subkategorie,
    verwendungszweck,
    transaktionstyp
  }
  
  console.log('Extracted bank statement record:', record)
  records.push(record)
  
  return records
}

export const calculateTotals = (records: AccountingRecord[]) => {
  const totals = {
    totalAmount: 0,
    byCategory: {} as { [key: string]: { amount: number } }
  }
  
  records.forEach(record => {
    totals.totalAmount += record.betrag
    
    if (record.kategorie) {
      if (!totals.byCategory[record.kategorie]) {
        totals.byCategory[record.kategorie] = { amount: 0 }
      }
      totals.byCategory[record.kategorie].amount += record.betrag
    }
  })
  
  return totals
}

export const validateRecord = (record: AccountingRecord): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!record.beschreibung.trim()) {
    errors.push('Beschreibung is required')
  }
  
  if (record.betrag === 0) {
    errors.push('Betrag is required')
  }
  
  if (record.datum && !validateDate(record.datum)) {
    errors.push('Date format is invalid')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const processOpenAIReceiptData = (data: OpenAIReceiptResponse): AccountingRecord[] => {
  console.log('Processing OpenAI receipt data:', data)
  
  const kategorie = data.kategorie || 'Sonstiges'
  const beschreibung = data.beschreibung || data.vendor_name || ''
  const subkategorie = getSubCategory(beschreibung, kategorie, 'receipt')
  
  // Provide fallback date if OCR didn't extract one
  const datum = data.datum || data.date || new Date().toLocaleDateString('de-DE')
  
  const record: AccountingRecord = {
    datum,
    betrag: typeof data.betrag_brutto === 'number' ? data.betrag_brutto : parseFloat(data.betrag_brutto || '0') || parseFloat(data.total_sum || '0') || 0,
    beschreibung,
    kategorie,
    subkategorie,
    rechnungsnummer: data.rechnungsnummer || '',
    unternehmen: data.unternehmen || data.vendor_name || '',
    mwst_betrag: typeof data.mwst_betrag === 'number' ? data.mwst_betrag : parseFloat(data.mwst_betrag || '0') || parseFloat(data.vat_tax || '0') || 0,
    mwst_satz: typeof data.mwst_satz === 'number' ? data.mwst_satz : parseFloat(data.mwst_satz || '0') || parseFloat(data.vat_rate || '0') || 0,
    betrag_brutto: typeof data.betrag_brutto === 'number' ? data.betrag_brutto : parseFloat(data.betrag_brutto || '0') || parseFloat(data.total_sum || '0') || 0,
    betrag_netto: typeof data.betrag_netto === 'number' ? data.betrag_netto : parseFloat(data.betrag_netto || '0') || parseFloat(data.net_amount || '0') || 0
  }
  
  // Relaxed validation - only require amount and description
  const hasValidData = record.betrag !== 0 && record.beschreibung
  if (!hasValidData) {
    console.log('Receipt record has insufficient data, skipping:', record)
    return []
  }
  
  console.log('Processed receipt record:', record)
  return [record]
}

export const processOpenAIBankStatementData = (data: OpenAIBankStatementResponse): AccountingRecord[] => {
  console.log('Processing OpenAI bank statement data:', data)
  
  const records: AccountingRecord[] = []
  
  if (data.transactions && Array.isArray(data.transactions)) {
    data.transactions.forEach((transaction, index) => {
      const kategorie = transaction.kategorie || 'Banktransaktion'
      const beschreibung = transaction.verwendungszweck || transaction.description || ''
      const subkategorie = getSubCategory(beschreibung, kategorie, 'bank-statement')
      
      const record: AccountingRecord = {
        datum: transaction.datum || transaction.date || '',
        betrag: typeof transaction.betrag === 'number' ? transaction.betrag : parseFloat(transaction.betrag || '0') || parseFloat(transaction.credit || '0') || parseFloat(transaction.debit || '0') || 0,
        beschreibung,
        kategorie,
        subkategorie,
        verwendungszweck: transaction.verwendungszweck || transaction.description || '',
        gegenkonto: transaction.gegenkonto || transaction.account_number || '',
        transaktionstyp: transaction.transaktionstyp || '',
        valuta: transaction.valuta || ''
      }
      
      // Validate that the record has meaningful data
      const hasValidData = record.datum && record.betrag !== 0 && record.beschreibung
      if (!hasValidData) {
        console.log(`Bank statement record ${index + 1} has insufficient data, skipping:`, record)
        return
      }
      
      console.log(`Processed bank statement record ${index + 1}:`, record)
      records.push(record)
    })
  } else if (data.datum || data.betrag) {
    // Handle single transaction response
    const kategorie = data.kategorie || 'Banktransaktion'
    const beschreibung = data.verwendungszweck || 'Banktransaktion'
    const subkategorie = getSubCategory(beschreibung, kategorie, 'bank-statement')
    
    const record: AccountingRecord = {
      datum: data.datum || '',
      betrag: typeof data.betrag === 'number' ? data.betrag : parseAmount(data.betrag || '0'),
      beschreibung,
      kategorie,
      subkategorie,
      verwendungszweck: data.verwendungszweck || '',
      gegenkonto: data.gegenkonto || '',
      transaktionstyp: data.transaktionstyp || '',
      valuta: data.valuta || ''
    }
    
    // Validate that the record has meaningful data (relaxed validation)
    const hasValidData = record.datum && record.betrag !== 0
    if (!hasValidData) {
      console.log('Single bank statement record has insufficient data, skipping:', record)
      return []
    }
    
    records.push(record)
  } else {
    // Fallback for empty data - don't add empty records
    console.log('No valid bank statement data found, returning empty array')
    return []
  }
  
  return records
}

// New function to handle direct OCR response format
export const processOCRResponse = (data: any, documentType: 'receipt' | 'bank-statement'): AccountingRecord[] => {
  console.log('Processing OCR response:', data, 'Document type:', documentType)
  
  if (documentType === 'receipt') {
    // Handle receipt data (single object)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return processOpenAIReceiptData(data)
    }
  } else if (documentType === 'bank-statement') {
    // Handle bank statement data (array of transactions)
    if (Array.isArray(data)) {
      // Direct array of transactions
      const records: AccountingRecord[] = []
      data.forEach((transaction, index) => {
        const kategorie = transaction.kategorie || 'Banktransaktion'
        const beschreibung = transaction.verwendungszweck || ''
        const subkategorie = getSubCategory(beschreibung, kategorie, 'bank-statement')
        
        const record: AccountingRecord = {
          datum: transaction.datum || '',
          betrag: typeof transaction.betrag === 'number' ? transaction.betrag : parseAmount(transaction.betrag || '0'),
          beschreibung,
          kategorie,
          subkategorie,
          verwendungszweck: transaction.verwendungszweck || '',
          gegenkonto: transaction.gegenkonto || '',
          transaktionstyp: transaction.transaktionstyp || '',
          valuta: transaction.valuta || ''
        }
        
        // Validate that the record has meaningful data (relaxed validation)
        const hasValidData = record.datum && record.betrag !== 0
        if (!hasValidData) {
          console.log(`Bank statement record ${index + 1} has insufficient data, skipping:`, record)
          return
        }
        
        console.log(`Processed bank statement record ${index + 1}:`, record)
        records.push(record)
      })
      return records
    } else if (data && typeof data === 'object') {
      // Single transaction object
      console.log('Processing single bank statement transaction object:', data)
      return processOpenAIBankStatementData(data)
    }
  } else {
    // Handle generic/unknown document type
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Try to determine if it's a receipt or bank statement based on the data structure
      if (data.rechnungsnummer || data.betrag_brutto || data.mwst_betrag) {
        console.log('Detected as receipt based on data structure')
        return processOpenAIReceiptData(data)
      } else if (data.verwendungszweck || data.transaktionstyp) {
        console.log('Detected as bank statement based on data structure')
        return processOpenAIBankStatementData(data)
      }
    }
  }
  
  // Fallback
  console.log('No valid data structure found, returning empty array')
  return []
}

export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const convertFileToBase64 = async (file: File): Promise<string> => {
  // For images, use the existing function
  return convertImageToBase64(file)
}

export const isValidFileType = (file: File): boolean => {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/bmp'
  ]
  
  // Check MIME type
  if (supportedTypes.includes(file.type)) {
    return true
  }
  
  // Check file extension as fallback
  const fileName = file.name.toLowerCase()
  const supportedExtensions = ['.jpeg', '.jpg', '.png', '.bmp']
  return supportedExtensions.some(ext => fileName.endsWith(ext))
}

export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export const generateExcelColumns = (data: AccountingRecord[]): string[] => {
  console.log('Generating Excel columns for data:', data)
  
  // Base columns that are always present
  const baseColumns = ['Datum', 'Betrag', 'Beschreibung', 'Kategorie', 'Subkategorie']
  
  // Additional columns based on data content
  const additionalColumns: string[] = []
  
  data.forEach(record => {
    if (record.rechnungsnummer && !additionalColumns.includes('Rechnungsnummer')) {
      additionalColumns.push('Rechnungsnummer')
    }
    if (record.unternehmen && !additionalColumns.includes('Unternehmen')) {
      additionalColumns.push('Unternehmen')
    }
    if (record.mwst_betrag && !additionalColumns.includes('MWST-Betrag')) {
      additionalColumns.push('MWST-Betrag')
    }
    if (record.mwst_satz && !additionalColumns.includes('MWST-Satz')) {
      additionalColumns.push('MWST-Satz')
    }
    if (record.verwendungszweck && !additionalColumns.includes('Verwendungszweck')) {
      additionalColumns.push('Verwendungszweck')
    }
    if (record.gegenkonto && !additionalColumns.includes('Gegenkonto')) {
      additionalColumns.push('Gegenkonto')
    }
    if (record.transaktionstyp && !additionalColumns.includes('Transaktionstyp')) {
      additionalColumns.push('Transaktionstyp')
    }
    // Removed valuta column as requested
    if (record.betrag_brutto && !additionalColumns.includes('Betrag Brutto')) {
      additionalColumns.push('Betrag Brutto')
    }
    if (record.betrag_netto && !additionalColumns.includes('Betrag Netto')) {
      additionalColumns.push('Betrag Netto')
    }
  })
  
  const allColumns = [...baseColumns, ...additionalColumns]
  console.log('Generated columns:', allColumns)
  return allColumns
}

export const convertToExcelData = (data: AccountingRecord[], columns: string[]): any[][] => {
  console.log('Converting data to Excel format with columns:', columns)
  
  return data.map(record => {
    return columns.map(column => {
      switch (column) {
        case 'Datum':
          return record.datum
        case 'Betrag':
          return record.betrag
        case 'Beschreibung':
          return record.beschreibung
        case 'Kategorie':
          return record.kategorie
        case 'Subkategorie':
          return record.subkategorie || ''
        case 'Rechnungsnummer':
          return record.rechnungsnummer || ''
        case 'Unternehmen':
          return record.unternehmen || ''
        case 'MWST-Betrag':
          return record.mwst_betrag || ''
        case 'MWST-Satz':
          return record.mwst_satz || ''
        case 'Verwendungszweck':
          return record.verwendungszweck || ''
        case 'Gegenkonto':
          return record.gegenkonto || ''
        case 'Transaktionstyp':
          return record.transaktionstyp || ''
        // Removed valuta case as requested
        case 'Betrag Brutto':
          return record.betrag_brutto || ''
        case 'Betrag Netto':
          return record.betrag_netto || ''
        default:
          return ''
      }
    })
  })
} 