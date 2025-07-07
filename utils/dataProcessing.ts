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
    if (lowerText.includes('rechnung') || lowerText.includes('quittung') || lowerText.includes('beleg') || lowerText.includes('invoice')) {
      console.log('Auto-detected as receipt')
      return extractReceiptData(text)
    } else if (lowerText.includes('kontoauszug') || lowerText.includes('bankauszug') || lowerText.includes('buchungsdatum') || lowerText.includes('account statement')) {
      console.log('Auto-detected as bank statement')
      return extractBankStatementData(text)
    } else {
      console.log('Could not auto-detect, trying receipt extraction')
      return extractReceiptData(text)
    }
  }
}

// New function to extract multiple transactions from bank statements
export const extractMultipleTransactions = (text: string): AccountingRecord[] => {
  console.log('=== MULTIPLE TRANSACTIONS EXTRACTION START ===')
  console.log('Input text length:', text.length)
  console.log('Full text content:')
  console.log('---START OF TEXT---')
  console.log(text)
  console.log('---END OF TEXT---')
  
  const records: AccountingRecord[] = []
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  console.log('Total lines to process:', lines.length)
  console.log('All lines:')
  lines.forEach((line, index) => {
    console.log(`Line ${index + 1}: "${line}"`)
  })
  
  // Also log the raw text for debugging
  console.log('=== RAW TEXT FOR DEBUGGING ===')
  console.log(text)
  console.log('=== END RAW TEXT ===')
  
  // More comprehensive transaction patterns
  const transactionPatterns = [
    // Date + Amount + Description pattern (most common)
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s+([+-]?\d+[.,]\d{2})\s+(.+)/,
    // Date + Description + Amount pattern
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s+(.+?)\s+([+-]?\d+[.,]\d{2})/,
    // Date + Amount with currency + Description
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s+([+-]?\d+[.,]\d{2}\s*[€$£]?)\s+(.+)/,
    // Date + Description + Amount with currency
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s+(.+?)\s+([+-]?\d+[.,]\d{2}\s*[€$£]?)/,
    // Simple date + amount pattern (fallback)
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s+([+-]?\d+[.,]\d{2})/,
    // More flexible patterns for different formats
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s*([+-]?\d+[.,]\d{2})\s*(.+)/,
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s*(.+?)\s*([+-]?\d+[.,]\d{2})/,
    // Handle different date formats
    /(\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})\s+([+-]?\d+[.,]\d{2})\s+(.+)/,
    /(\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})\s+(.+?)\s+([+-]?\d+[.,]\d{2})/,
    // German bank statement patterns
    /(\d{1,2}\.\d{1,2}\.\d{2,4})\s+([+-]?\d+[.,]\d{2})\s+(.+)/,
    /(\d{1,2}\.\d{1,2}\.\d{2,4})\s+(.+?)\s+([+-]?\d+[.,]\d{2})/,
    // Patterns with different separators
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s*([+-]?\d+[.,]\d{2})\s*[€$£]?\s*(.+)/,
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s*(.+?)\s*[€$£]?\s*([+-]?\d+[.,]\d{2})/,
    // Very flexible patterns
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}).*?([+-]?\d+[.,]\d{2}).*?(.+)/,
    /(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}).*?(.+).*?([+-]?\d+[.,]\d{2})/,
  ]
  
  let processedLines = 0
  
  for (const line of lines) {
    processedLines++
    const trimmedLine = line.trim()
    
    if (trimmedLine.length < 10) continue // Skip very short lines
    
    console.log(`Processing line ${processedLines}: "${trimmedLine}"`)
    
    let matchFound = false
    
    for (const pattern of transactionPatterns) {
      const match = trimmedLine.match(pattern)
      if (match) {
        console.log(`Pattern matched for line ${processedLines}:`, match)
        
        let dateStr: string, amountStr: string, description: string
        
        if (match.length === 4) {
          // Full pattern with description
          [, dateStr, amountStr, description] = match
        } else if (match.length === 3) {
          // Simple pattern without description
          [, dateStr, amountStr] = match
          description = 'Transaction'
        } else {
          continue // Skip if pattern doesn't match expected format
        }
        
        // Parse date
        const dateMatch = dateStr.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/)
        const datum = dateMatch ? `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}` : ''
        
        // Parse amount
        const cleanAmountStr = amountStr.replace(/[€$£\s]/g, '').replace(',', '.')
        const betrag = parseFloat(cleanAmountStr)
        
        console.log(`Parsed - Date: ${datum}, Amount: ${betrag}, Description: ${description}`)
        
        if (!isNaN(betrag) && datum && betrag !== 0) {
          // Determine transaction type and category
          const lowerDescription = (description || '').toLowerCase()
          let transaktionstyp = 'Überweisung'
          let kategorie = 'Banktransaktion'
          
          if (lowerDescription.includes('lastschrift') || lowerDescription.includes('debit')) {
            transaktionstyp = 'Lastschrift'
          } else if (lowerDescription.includes('gutschrift') || lowerDescription.includes('credit') || lowerDescription.includes('einzahlung')) {
            transaktionstyp = 'Gutschrift'
          } else if (lowerDescription.includes('abhebung') || lowerDescription.includes('withdrawal')) {
            transaktionstyp = 'Abhebung'
          }
          
          // Determine category based on description
          if (lowerDescription.includes('gehalt') || lowerDescription.includes('lohn') || lowerDescription.includes('salary')) {
            kategorie = 'Einnahmen'
          } else if (lowerDescription.includes('miete') || lowerDescription.includes('rent')) {
            kategorie = 'Miete & Pacht'
          } else if (lowerDescription.includes('gebühr') || lowerDescription.includes('fee')) {
            kategorie = 'Betriebsausgaben'
          } else if (lowerDescription.includes('versicherung') || lowerDescription.includes('insurance')) {
            kategorie = 'Versicherungen'
          } else if (lowerDescription.includes('steuer') || lowerDescription.includes('tax')) {
            kategorie = 'Steuern'
          }
          
          const record: AccountingRecord = {
            datum,
            betrag,
            beschreibung: description?.trim() || 'Transaction',
            kategorie,
            subkategorie: getSubCategory(lowerDescription, kategorie, 'bank-statement'),
            verwendungszweck: description?.trim() || 'Transaction',
            transaktionstyp
          }
          
          records.push(record)
          console.log('Extracted transaction:', record)
          matchFound = true
          break
        }
      }
    }
    
    if (!matchFound) {
      console.log(`No pattern matched for line ${processedLines}`)
      
      // Try a more flexible approach - look for any line with date and amount
      const dateInLine = trimmedLine.match(/\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}/) || trimmedLine.match(/\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}/)
      const amountInLine = trimmedLine.match(/\d+[.,]\d{2}/)
      
      if (dateInLine && amountInLine) {
        console.log(`Found date and amount in line ${processedLines}, trying flexible extraction`)
        
        // Extract date
        const dateStr = dateInLine[0]
        const dateMatch = dateStr.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/) || dateStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/)
        const datum = dateMatch ? 
          (dateMatch[1].length === 4 ? 
            `${dateMatch[3].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[1]}` :
            `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}`
          ) : ''
        
        // Extract amount
        const amountStr = amountInLine[0]
        const betrag = parseFloat(amountStr.replace(',', '.'))
        
        // Extract description (everything except date and amount)
        let description = trimmedLine
          .replace(dateStr, '')
          .replace(amountStr, '')
          .replace(/[€$£\s]+/g, ' ')
          .trim()
        
        if (!description || description.length < 3) {
          description = 'Transaction'
        }
        
        if (!isNaN(betrag) && datum && betrag !== 0) {
          const record: AccountingRecord = {
            datum,
            betrag,
            beschreibung: description,
            kategorie: 'Banktransaktion',
            subkategorie: 'Überweisung',
            verwendungszweck: description,
            transaktionstyp: betrag > 0 ? 'Gutschrift' : 'Lastschrift'
          }
          
          records.push(record)
          console.log('Extracted transaction (flexible):', record)
        }
      }
    }
  }
  
  console.log(`Extracted ${records.length} transactions from ${processedLines} lines`)
  
  // If no transactions found with line-by-line parsing, try table extraction
  if (records.length === 0) {
    console.log('No transactions found with line parsing, trying table extraction...')
    const tableRecords = extractTableData(text)
    if (tableRecords.length > 0) {
      console.log(`Found ${tableRecords.length} records from table extraction`)
      return tableRecords
    }
  }
  
  // If still no records, try a very simple approach - look for any line with numbers
  if (records.length === 0) {
    console.log('No transactions found, trying simple number extraction...')
    const simpleRecords = extractSimpleTransactions(text)
    if (simpleRecords.length > 0) {
      console.log(`Found ${simpleRecords.length} records from simple extraction`)
      return simpleRecords
    }
  }
  
  return records
}

// Function to extract data from table-like structures
const extractTableData = (text: string): AccountingRecord[] => {
  console.log('Extracting table data...')
  
  const records: AccountingRecord[] = []
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // Look for table headers to identify data rows
  const headerPatterns = [
    /datum|date|buchungsdatum|booking\s*date/i,
    /betrag|amount|summe|total/i,
    /beschreibung|description|verwendungszweck|purpose/i,
    /kategorie|category/i
  ]
  
  let dataStartIndex = -1
  
  // Find where data starts (after headers)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    const hasHeader = headerPatterns.some(pattern => pattern.test(line))
    if (hasHeader) {
      dataStartIndex = i + 1
      break
    }
  }
  
  if (dataStartIndex === -1) {
    // No headers found, try to find data rows directly
    dataStartIndex = 0
  }
  
  console.log(`Starting data extraction from line ${dataStartIndex}`)
  
  // Process data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines and header-like lines
    if (line.length < 10 || /^[a-z\s]+$/i.test(line)) continue
    
    // Try to extract data from the line
    const dataMatch = line.match(/(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})\s+(.+?)\s+([+-]?\d+[.,]\d{2})/)
    if (dataMatch) {
      const [, dateStr, description, amountStr] = dataMatch
      
      // Parse date
      const dateMatch = dateStr.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/)
      const datum = dateMatch ? `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}` : ''
      
      // Parse amount
      const betrag = parseFloat(amountStr.replace(',', '.').replace(/[€$£\s]/g, ''))
      
      if (!isNaN(betrag) && datum && betrag !== 0) {
        const record: AccountingRecord = {
          datum,
          betrag,
          beschreibung: description.trim(),
          kategorie: 'Banktransaktion',
          subkategorie: 'Überweisung',
          verwendungszweck: description.trim(),
          transaktionstyp: betrag > 0 ? 'Gutschrift' : 'Lastschrift'
        }
        
        records.push(record)
        console.log('Extracted table record:', record)
      }
    }
  }
  
  console.log(`Extracted ${records.length} records from table data`)
  return records
}

// Function to extract transactions using a very simple approach
const extractSimpleTransactions = (text: string): AccountingRecord[] => {
  console.log('Extracting simple transactions...')
  
  const records: AccountingRecord[] = []
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // Look for any line that contains both a date and an amount
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Skip very short lines
    if (trimmedLine.length < 10) continue
    
    // Look for date pattern
    const dateMatch = trimmedLine.match(/(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})/)
    if (!dateMatch) continue
    
    // Look for amount pattern
    const amountMatch = trimmedLine.match(/([+-]?\d+[.,]\d{2})/)
    if (!amountMatch) continue
    
    // Extract date
    const dateStr = dateMatch[1]
    const dateParts = dateStr.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/)
    const datum = dateParts ? `${dateParts[1].padStart(2, '0')}.${dateParts[2].padStart(2, '0')}.${dateParts[3].length === 2 ? '20' + dateParts[3] : dateParts[3]}` : ''
    
    // Extract amount
    const betrag = parseFloat(amountMatch[1].replace(',', '.'))
    
    // Extract description (everything except date and amount)
    let description = trimmedLine
      .replace(dateStr, '')
      .replace(amountMatch[1], '')
      .replace(/[€$£\s]+/g, ' ')
      .trim()
    
    if (!description || description.length < 3) {
      description = 'Transaction'
    }
    
    if (!isNaN(betrag) && datum && betrag !== 0) {
      const record: AccountingRecord = {
        datum,
        betrag,
        beschreibung: description,
        kategorie: 'Banktransaktion',
        subkategorie: 'Überweisung',
        verwendungszweck: description,
        transaktionstyp: betrag > 0 ? 'Gutschrift' : 'Lastschrift'
      }
      
      records.push(record)
      console.log('Extracted simple transaction:', record)
    }
  }
  
  console.log(`Extracted ${records.length} simple transactions`)
  return records
}

// Function to extract line items from receipts
const extractLineItems = (text: string): AccountingRecord[] => {
  console.log('Extracting line items from receipt...')
  
  const records: AccountingRecord[] = []
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // Extract the main receipt date and company info first
  const dateMatch = text.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/)
  const datum = dateMatch ? `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}` : ''
  
  // Extract company name
  const companyMatch = text.match(/([A-ZÄÖÜ][a-zäöüß\s&\.]+(?:GmbH|AG|KG|OHG|e\.V\.|UG|Co\.|Inc\.|Ltd\.))/)
  const unternehmen = companyMatch ? companyMatch[1].trim() : ''
  
  // Look for line item patterns
  const lineItemPatterns = [
    // Item + Amount pattern
    /(.+?)\s+(\d+[.,]\d{2})/,
    // Amount + Item pattern
    /(\d+[.,]\d{2})\s+(.+)/,
    // Item + Quantity + Amount pattern
    /(.+?)\s+(\d+)\s+(\d+[.,]\d{2})/,
  ]
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Skip lines that are too short or look like headers/totals
    if (trimmedLine.length < 5 || 
        trimmedLine.toLowerCase().includes('total') ||
        trimmedLine.toLowerCase().includes('summe') ||
        trimmedLine.toLowerCase().includes('gesamt') ||
        trimmedLine.toLowerCase().includes('mwst') ||
        trimmedLine.toLowerCase().includes('ust')) {
      continue
    }
    
    for (const pattern of lineItemPatterns) {
      const match = trimmedLine.match(pattern)
      if (match) {
        let itemName: string, amountStr: string
        
        if (match.length === 3) {
          if (match[1].match(/\d+[.,]\d{2}/)) {
            // Amount + Item pattern
            [, amountStr, itemName] = match
          } else {
            // Item + Amount pattern
            [, itemName, amountStr] = match
          }
        } else if (match.length === 4) {
          // Item + Quantity + Amount pattern
          [, itemName, , amountStr] = match
        } else {
          continue
        }
        
        const betrag = parseFloat(amountStr.replace(',', '.'))
        
        if (!isNaN(betrag) && betrag > 0 && itemName.trim().length > 2) {
          const record: AccountingRecord = {
            datum,
            betrag,
            beschreibung: itemName.trim(),
            kategorie: 'Betriebsausgaben',
            subkategorie: 'Material',
            unternehmen,
            mwst_betrag: betrag * 0.19, // Estimate VAT
            mwst_satz: 19,
            betrag_brutto: betrag,
            betrag_netto: betrag / 1.19
          }
          
          records.push(record)
          console.log('Extracted line item:', record)
        }
        break
      }
    }
  }
  
  console.log(`Extracted ${records.length} line items`)
  return records
}

const extractReceiptData = (text: string): AccountingRecord[] => {
  console.log('Extracting receipt data...')
  
  const records: AccountingRecord[] = []
  
  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim()
  console.log('Cleaned text:', cleanText.substring(0, 300) + '...')
  
  // First, try to extract multiple line items from the receipt
  const lineItems = extractLineItems(cleanText)
  if (lineItems.length > 0) {
    console.log(`Found ${lineItems.length} line items, creating separate records`)
    return lineItems
  }
  
  // Extract date - multiple patterns
  let datum = ''
  const datePatterns = [
    /(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/, // DD.MM.YYYY or DD-MM-YYYY
    /(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})/, // DD MM YYYY
    /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/, // YYYY.MM.DD
  ]
  
  for (const pattern of datePatterns) {
    const dateMatch = cleanText.match(pattern)
    if (dateMatch) {
      if (dateMatch[1].length === 4) {
        // YYYY.MM.DD format
        datum = `${dateMatch[3].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[1]}`
      } else {
        // DD.MM.YYYY format
        datum = `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}`
      }
      break
    }
  }
  
  console.log('Extracted date:', datum)
  
  // Extract amounts - multiple patterns
  const amountPatterns = [
    /(\d+[.,]\d{2})/g, // Standard decimal format
    /(\d+)\s*[€$£]/g, // Amount with currency symbol
    /[€$£]\s*(\d+[.,]\d{2})/g, // Currency symbol with amount
  ]
  
  let amounts: number[] = []
  for (const pattern of amountPatterns) {
    const matches = cleanText.match(pattern)
    if (matches) {
      amounts = matches.map(amt => {
        const numStr = amt.replace(/[€$£\s]/g, '').replace(',', '.')
        return parseFloat(numStr)
      }).filter(num => !isNaN(num) && num > 0)
      if (amounts.length > 0) break
    }
  }
  
  // Find the largest amount (usually the total)
  const betrag = amounts.length > 0 ? Math.max(...amounts) : 0
  console.log('Extracted amounts:', amounts, 'Selected betrag:', betrag)
  
  // Extract company name - multiple patterns
  let unternehmen = ''
  const companyPatterns = [
    /([A-ZÄÖÜ][a-zäöüß\s&\.]+(?:GmbH|AG|KG|OHG|e\.V\.|UG|Co\.|Inc\.|Ltd\.))/,
    /([A-ZÄÖÜ][a-zäöüß\s&\.]{3,30})/, // General company name pattern
    /(?:von|by|für)\s+([A-ZÄÖÜ][a-zäöüß\s&\.]+)/, // "von Company" pattern
  ]
  
  for (const pattern of companyPatterns) {
    const companyMatch = cleanText.match(pattern)
    if (companyMatch && companyMatch[1].length > 3) {
      unternehmen = companyMatch[1].trim()
      break
    }
  }
  
  console.log('Extracted company:', unternehmen)
  
  // Extract invoice number - multiple patterns
  let rechnungsnummer = ''
  const invoicePatterns = [
    /(?:Rechn\.?\s*Nr\.?|Invoice|Nr\.?|Rechnung)\s*[:#]?\s*([A-Z0-9\-_]+)/i,
    /(?:No\.?|Number)\s*[:#]?\s*([A-Z0-9\-_]+)/i,
    /([A-Z]{2,4}\d{4,8})/, // Common invoice number pattern
  ]
  
  for (const pattern of invoicePatterns) {
    const invoiceMatch = cleanText.match(pattern)
    if (invoiceMatch) {
      rechnungsnummer = invoiceMatch[1]
      break
    }
  }
  
  console.log('Extracted invoice number:', rechnungsnummer)
  
  // Extract VAT - multiple patterns
  let mwst_betrag = 0
  const vatPatterns = [
    /(?:MWST|USt|Steuer|VAT)\s*[:=]?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*(?:MWST|USt|Steuer|VAT)/i,
    /(?:MwSt|USt)\s*(\d+[.,]\d{2})/i,
  ]
  
  for (const pattern of vatPatterns) {
    const vatMatch = cleanText.match(pattern)
    if (vatMatch) {
      mwst_betrag = parseFloat(vatMatch[1].replace(',', '.'))
      break
    }
  }
  
  console.log('Extracted VAT:', mwst_betrag)
  
  // Determine category based on text content
  const lowerText = cleanText.toLowerCase()
  let kategorie = 'Sonstiges'
  
  if (lowerText.includes('restaurant') || lowerText.includes('café') || lowerText.includes('imbiss') || lowerText.includes('gastronomie')) {
    kategorie = 'Verpflegung'
  } else if (lowerText.includes('tank') || lowerText.includes('benzin') || lowerText.includes('diesel') || lowerText.includes('kraftstoff')) {
    kategorie = 'Fahrzeugkosten'
  } else if (lowerText.includes('büro') || lowerText.includes('papier') || lowerText.includes('drucker') || lowerText.includes('material')) {
    kategorie = 'Betriebsausgaben'
  } else if (lowerText.includes('hotel') || lowerText.includes('übernachtung') || lowerText.includes('unterkunft')) {
    kategorie = 'Reisekosten'
  } else if (lowerText.includes('software') || lowerText.includes('lizenz') || lowerText.includes('programm')) {
    kategorie = 'IT & Software'
  } else if (lowerText.includes('versicherung') || lowerText.includes('versichert')) {
    kategorie = 'Versicherungen'
  }
  
  // Get sub-category
  const subkategorie = getSubCategory(lowerText, kategorie, 'receipt')
  
  // Create description from company name or text content
  let beschreibung = unternehmen || 'Beleg'
  if (!unternehmen) {
    // Try to extract a meaningful description from the text
    const lines = cleanText.split('\n').filter(line => line.trim().length > 5)
    if (lines.length > 0) {
      beschreibung = lines[0].substring(0, 50).trim()
    }
  }
  
  const record: AccountingRecord = {
    datum,
    betrag,
    beschreibung,
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
  
  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim()
  console.log('Cleaned text:', cleanText.substring(0, 300) + '...')
  
  // Extract date - multiple patterns
  let datum = ''
  const datePatterns = [
    /(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/, // DD.MM.YYYY or DD-MM-YYYY
    /(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})/, // DD MM YYYY
    /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/, // YYYY.MM.DD
  ]
  
  for (const pattern of datePatterns) {
    const dateMatch = cleanText.match(pattern)
    if (dateMatch) {
      if (dateMatch[1].length === 4) {
        // YYYY.MM.DD format
        datum = `${dateMatch[3].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[1]}`
      } else {
        // DD.MM.YYYY format
        datum = `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}`
      }
      break
    }
  }
  
  console.log('Extracted date:', datum)
  
  // Extract amounts - multiple patterns
  const amountPatterns = [
    /(\d+[.,]\d{2})/g, // Standard decimal format
    /(\d+)\s*[€$£]/g, // Amount with currency symbol
    /[€$£]\s*(\d+[.,]\d{2})/g, // Currency symbol with amount
  ]
  
  let amounts: number[] = []
  for (const pattern of amountPatterns) {
    const matches = cleanText.match(pattern)
    if (matches) {
      amounts = matches.map(amt => {
        const numStr = amt.replace(/[€$£\s]/g, '').replace(',', '.')
        return parseFloat(numStr)
      }).filter(num => !isNaN(num) && num > 0)
      if (amounts.length > 0) break
    }
  }
  
  // Use the first amount found (usually the transaction amount)
  const betrag = amounts.length > 0 ? amounts[0] : 0
  console.log('Extracted amounts:', amounts, 'Selected betrag:', betrag)
  
  // Extract description/purpose - improved pattern matching
  let verwendungszweck = ''
  const lines = cleanText.split('\n')
  
  // Look for meaningful lines that could be descriptions
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.length > 5 && 
        trimmedLine.length < 100 && 
        !trimmedLine.match(/^\d/) && 
        !trimmedLine.includes('EUR') && 
        !trimmedLine.includes('€') &&
        !trimmedLine.includes('Datum') &&
        !trimmedLine.includes('Betrag') &&
        !trimmedLine.includes('Saldo')) {
      verwendungszweck = trimmedLine
      break
    }
  }
  
  // If no description found, try to extract from text patterns
  if (!verwendungszweck) {
    const descPatterns = [
      /(?:Verwendungszweck|Zweck|Beschreibung)\s*[:=]?\s*([^\n]+)/i,
      /(?:von|an)\s+([A-ZÄÖÜ][a-zäöüß\s&\.]+)/,
    ]
    
    for (const pattern of descPatterns) {
      const descMatch = cleanText.match(pattern)
      if (descMatch) {
        verwendungszweck = descMatch[1].trim()
        break
      }
    }
  }
  
  console.log('Extracted description:', verwendungszweck)
  
  // Determine transaction type
  const lowerText = cleanText.toLowerCase()
  let transaktionstyp = 'Überweisung'
  let kategorie = 'Banktransaktion'
  
  if (lowerText.includes('lastschrift') || lowerText.includes('sepa-lastschrift')) {
    transaktionstyp = 'Lastschrift'
  } else if (lowerText.includes('gutschrift') || lowerText.includes('einzahlung')) {
    transaktionstyp = 'Gutschrift'
  } else if (lowerText.includes('abhebung') || lowerText.includes('auszahlung')) {
    transaktionstyp = 'Abhebung'
  } else if (lowerText.includes('überweisung') || lowerText.includes('transfer')) {
    transaktionstyp = 'Überweisung'
  }
  
  // Determine category based on content
  if (lowerText.includes('gehalt') || lowerText.includes('lohn') || lowerText.includes('salary')) {
    kategorie = 'Einnahmen'
  } else if (lowerText.includes('miete') || lowerText.includes('miet') || lowerText.includes('rent')) {
    kategorie = 'Miete & Pacht'
  } else if (lowerText.includes('gebühr') || lowerText.includes('gebühren') || lowerText.includes('fee')) {
    kategorie = 'Betriebsausgaben'
  } else if (lowerText.includes('versicherung') || lowerText.includes('insurance')) {
    kategorie = 'Versicherungen'
  } else if (lowerText.includes('steuer') || lowerText.includes('tax')) {
    kategorie = 'Steuern'
  } else if (lowerText.includes('strom') || lowerText.includes('gas') || lowerText.includes('electricity')) {
    kategorie = 'Nebenkosten'
  }
  
  // Get sub-category
  const subkategorie = getSubCategory(lowerText, kategorie, 'bank-statement')
  
  // Create description if not found
  if (!verwendungszweck) {
    verwendungszweck = `${transaktionstyp} - ${kategorie}`
  }
  
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
    'image/bmp',
    'application/pdf'
  ]
  
  // Check MIME type
  if (supportedTypes.includes(file.type)) {
    return true
  }
  
  // Check file extension as fallback
  const fileName = file.name.toLowerCase()
  const supportedExtensions = ['.jpeg', '.jpg', '.png', '.bmp', '.pdf']
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

/**
 * Convert data to CSV format
 */
export const convertToCSV = (data: AccountingRecord[], columns: string[]): string => {
  console.log('Converting data to CSV format with columns:', columns)
  
  // Create header row
  const headerRow = columns.join(',')
  
  // Create data rows
  const dataRows = data.map(record => {
    return columns.map(column => {
      let value = ''
      switch (column) {
        case 'Datum':
          value = record.datum
          break
        case 'Betrag':
          value = record.betrag.toString()
          break
        case 'Beschreibung':
          value = `"${record.beschreibung.replace(/"/g, '""')}"` // Escape quotes
          break
        case 'Kategorie':
          value = record.kategorie
          break
        case 'Subkategorie':
          value = record.subkategorie || ''
          break
        case 'Rechnungsnummer':
          value = record.rechnungsnummer || ''
          break
        case 'Unternehmen':
          value = `"${(record.unternehmen || '').replace(/"/g, '""')}"` // Escape quotes
          break
        case 'MWST-Betrag':
          value = record.mwst_betrag?.toString() || ''
          break
        case 'MWST-Satz':
          value = record.mwst_satz?.toString() || ''
          break
        case 'Verwendungszweck':
          value = `"${(record.verwendungszweck || '').replace(/"/g, '""')}"` // Escape quotes
          break
        case 'Gegenkonto':
          value = `"${(record.gegenkonto || '').replace(/"/g, '""')}"` // Escape quotes
          break
        case 'Transaktionstyp':
          value = record.transaktionstyp || ''
          break
        case 'Betrag Brutto':
          value = record.betrag_brutto?.toString() || ''
          break
        case 'Betrag Netto':
          value = record.betrag_netto?.toString() || ''
          break
        default:
          value = ''
      }
      return value
    }).join(',')
  })
  
  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows].join('\n')
  
  console.log('CSV content generated, length:', csvContent.length)
  return csvContent
}

/**
 * Download data as CSV file
 */
export const downloadCSV = (data: AccountingRecord[], filename: string = 'accounting_data.csv'): void => {
  const columns = generateExcelColumns(data)
  const csvContent = convertToCSV(data, columns)
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
} 