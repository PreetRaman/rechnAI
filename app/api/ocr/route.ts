import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, documentType, language = 'de', fileType } = await request.json()
    
    console.log('OCR API called with document type:', documentType, 'language:', language, 'fileType:', fileType)
    console.log('Base64 data length:', imageBase64 ? imageBase64.length : 'undefined')
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }



    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          code: 'MISSING_API_KEY'
        }, 
        { status: 500 }
      )
    }
    
    console.log('OpenAI API key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No')

    // Determine the appropriate prompt based on document type and language
    let systemPrompt = ''
    let userPrompt = ''
    
    if (documentType === 'receipt') {
      console.log('Using receipt-specific prompts')
      if (language === 'de') {
        systemPrompt = `Du bist ein Experte für deutsche Buchhaltung und Steuerrecht. Analysiere das Bild einer Rechnung oder eines Belegs und extrahiere alle relevanten buchhalterischen Informationen. Gib die Daten als JSON-Objekt zurück.`
        
        userPrompt = `Analysiere dieses Bild einer Rechnung oder eines Belegs und extrahiere folgende Informationen:

WICHTIG: Gib die Antwort NUR als gültiges JSON-Objekt zurück, ohne zusätzlichen Text.

Erforderliche Felder für Rechnungen/Belege:
- "rechnungsnummer": Rechnungsnummer oder Belegnummer (falls vorhanden)
- "datum": Rechnungsdatum im Format DD.MM.YYYY (suche nach Datum, Rechnungsdatum, Ausstellungsdatum)
- "betrag_brutto": Gesamtbetrag inkl. MWST (als Zahl)
- "betrag_netto": Betrag ohne MWST (als Zahl)
- "mwst_betrag": MWST-Betrag (als Zahl)
- "mwst_satz": MWST-Satz in Prozent (als Zahl, z.B. 19)
- "unternehmen": Name des ausstellenden Unternehmens
- "beschreibung": Kurze Beschreibung der Leistung/Ware
- "kategorie": Deutsche Buchhaltungskategorie (z.B. "Büromaterial", "Fahrtkosten", "Verpflegung", "Dienstleistungen")

Falls ein Feld nicht gefunden werden kann, setze es auf null.

Beispiel-Response:
{
  "rechnungsnummer": "RE-2024-001",
  "datum": "15.01.2024",
  "betrag_brutto": 119.00,
  "betrag_netto": 100.00,
  "mwst_betrag": 19.00,
  "mwst_satz": 19,
  "unternehmen": "Muster GmbH",
  "beschreibung": "Büromaterial",
  "kategorie": "Büromaterial"
}`
      } else {
        systemPrompt = `You are an expert in German accounting and tax law. Analyze the image of a receipt or invoice and extract all relevant accounting information. Return the data as a JSON object.`
        
        userPrompt = `Analyze this image of a receipt or invoice and extract the following information:

IMPORTANT: Return the answer ONLY as a valid JSON object, without additional text.

Required fields for receipts/invoices:
- "rechnungsnummer": Invoice number or receipt number (if available)
- "datum": Invoice date in DD.MM.YYYY format (look for date, invoice date, issue date)
- "betrag_brutto": Total amount including VAT (as number)
- "betrag_netto": Amount without VAT (as number)
- "mwst_betrag": VAT amount (as number)
- "mwst_satz": VAT rate in percent (as number, e.g. 19)
- "unternehmen": Name of the issuing company
- "beschreibung": Brief description of service/goods
- "kategorie": German accounting category (e.g. "Büromaterial", "Fahrtkosten", "Verpflegung", "Dienstleistungen")

If a field cannot be found, set it to null.

Example response:
{
  "rechnungsnummer": "RE-2024-001",
  "datum": "15.01.2024",
  "betrag_brutto": 119.00,
  "betrag_netto": 100.00,
  "mwst_betrag": 19.00,
  "mwst_satz": 19,
  "unternehmen": "Muster GmbH",
  "beschreibung": "Büromaterial",
  "kategorie": "Büromaterial"
}`
      }
    } else if (documentType === 'bank-statement') {
      console.log('Using bank statement-specific prompts')
      if (language === 'de') {
        systemPrompt = `Du bist ein Experte für deutsche Bankauszüge und Buchhaltung. Analysiere das Bild eines Kontoauszugs und extrahiere alle relevanten Transaktionsinformationen. Gib die Daten als JSON-Array zurück.`
        
        userPrompt = `Analysiere dieses Bild eines Kontoauszugs und extrahiere ALLE Transaktionen:

WICHTIG: Gib die Antwort NUR als gültiges JSON-Array zurück, ohne zusätzlichen Text. Jede Transaktion ist ein Objekt im Array.

Erforderliche Felder für jede Transaktion:
- "datum": Buchungsdatum im Format DD.MM.YYYY
- "valuta": Wertstellungsdatum im Format DD.MM.YYYY (falls vorhanden, sonst null)
- "betrag": Transaktionsbetrag (als Zahl, negativ für Ausgaben, positiv für Einnahmen)
- "verwendungszweck": Buchungstext oder Verwendungszweck
- "gegenkonto": Name des Gegenkontos oder Empfängers/Zahlungspflichtigen (falls erkennbar, sonst null)
- "transaktionstyp": Art der Transaktion (z.B. "Überweisung", "Lastschrift", "Gutschrift", "Abhebung", "Bargeldabhebung")
- "kategorie": Deutsche Buchhaltungskategorie (z.B. "Einnahmen", "Ausgaben", "Bankgebühren", "Zinsen")

Extrahiere ALLE sichtbaren Transaktionen aus dem Kontoauszug. Falls ein Feld nicht gefunden werden kann, setze es auf null.

Beispiel-Response:
[
  {
    "datum": "15.01.2024",
    "valuta": "15.01.2024",
    "betrag": -150.00,
    "verwendungszweck": "Überweisung für Büromaterial",
    "gegenkonto": "Bürobedarf Schmidt GmbH",
    "transaktionstyp": "Überweisung",
    "kategorie": "Büromaterial"
  },
  {
    "datum": "14.01.2024",
    "valuta": "14.01.2024",
    "betrag": 2500.00,
    "verwendungszweck": "Gehalt Januar 2024",
    "gegenkonto": "Arbeitgeber GmbH",
    "transaktionstyp": "Gutschrift",
    "kategorie": "Einnahmen"
  }
]`
      } else {
        systemPrompt = `You are an expert in German bank statements and accounting. Analyze the image of a bank statement and extract all relevant transaction information. Return the data as a JSON array.`
        
        userPrompt = `Analyze this image of a bank statement and extract ALL transactions:

IMPORTANT: Return the answer ONLY as a valid JSON array, without additional text. Each transaction is an object in the array.

Required fields for each transaction:
- "datum": Booking date in DD.MM.YYYY format
- "valuta": Value date in DD.MM.YYYY format (if available, otherwise null)
- "betrag": Transaction amount (as number, negative for expenses, positive for income)
- "verwendungszweck": Booking text or purpose
- "gegenkonto": Name of counter account or recipient/payer (if recognizable, otherwise null)
- "transaktionstyp": Type of transaction (e.g. "Überweisung", "Lastschrift", "Gutschrift", "Abhebung", "Bargeldabhebung")
- "kategorie": German accounting category (e.g. "Einnahmen", "Ausgaben", "Bankgebühren", "Zinsen")

Extract ALL visible transactions from the bank statement. If a field cannot be found, set it to null.

Example response:
[
  {
    "datum": "15.01.2024",
    "valuta": "15.01.2024",
    "betrag": -150.00,
    "verwendungszweck": "Überweisung für Büromaterial",
    "gegenkonto": "Bürobedarf Schmidt GmbH",
    "transaktionstyp": "Überweisung",
    "kategorie": "Büromaterial"
  },
  {
    "datum": "14.01.2024",
    "valuta": "14.01.2024",
    "betrag": 2500.00,
    "verwendungszweck": "Gehalt Januar 2024",
    "gegenkonto": "Arbeitgeber GmbH",
    "transaktionstyp": "Gutschrift",
    "kategorie": "Einnahmen"
  }
]`
      }
    } else {
      console.log('Document type not specified, using generic prompts')
      if (language === 'de') {
        systemPrompt = `Du bist ein Experte für deutsche Buchhaltung. Analysiere das Bild und extrahiere alle relevanten buchhalterischen Informationen. Gib die Daten als JSON-Objekt zurück.`
        
        userPrompt = `Analysiere dieses Bild und extrahiere alle relevanten buchhalterischen Informationen:

WICHTIG: Gib die Antwort NUR als gültiges JSON-Objekt zurück, ohne zusätzlichen Text.

Versuche zu erkennen, ob es sich um eine Rechnung/Beleg oder einen Kontoauszug handelt und extrahiere die entsprechenden Felder.

Für Rechnungen/Belege:
- "rechnungsnummer", "datum", "betrag_brutto", "betrag_netto", "mwst_betrag", "mwst_satz", "unternehmen", "beschreibung", "kategorie"

Für Kontoauszüge:
- "datum", "valuta", "betrag", "verwendungszweck", "gegenkonto", "transaktionstyp", "kategorie"

Falls ein Feld nicht gefunden werden kann, setze es auf null.`
      } else {
        systemPrompt = `You are an expert in German accounting. Analyze the image and extract all relevant accounting information. Return the data as a JSON object.`
        
        userPrompt = `Analyze this image and extract all relevant accounting information:

IMPORTANT: Return the answer ONLY as a valid JSON object, without additional text.

Try to recognize whether it's a receipt/invoice or bank statement and extract the corresponding fields.

For receipts/invoices:
- "rechnungsnummer", "datum", "betrag_brutto", "betrag_netto", "mwst_betrag", "mwst_satz", "unternehmen", "beschreibung", "kategorie"

For bank statements:
- "datum", "valuta", "betrag", "verwendungszweck", "gegenkonto", "transaktionstyp", "kategorie"

If a field cannot be found, set it to null.`
      }
    }

    console.log('Sending request to OpenAI Vision API...')
    console.log('Using MIME type:', fileType === 'application/pdf' ? 'application/pdf' : 'image/jpeg')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })

    console.log('OpenAI response received')
    
    const content = response.choices[0]?.message?.content
    console.log('OpenAI content length:', content ? content.length : 'undefined')
    console.log('OpenAI content preview:', content ? content.substring(0, 200) + '...' : 'undefined')

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Try to parse JSON from the response
    let parsedData = null
    let rawText = content
    
    try {
      // First try to find JSON array
      const arrayMatch = content.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        parsedData = JSON.parse(arrayMatch[0])
        console.log('Successfully parsed JSON array data:', parsedData)
      } else {
        // Then try to find JSON object
        const objectMatch = content.match(/\{[\s\S]*\}/)
        if (objectMatch) {
          parsedData = JSON.parse(objectMatch[0])
          console.log('Successfully parsed JSON object data:', parsedData)
        } else {
          console.log('No JSON found in response, using raw text')
        }
      }
    } catch (parseError) {
      console.log('Failed to parse JSON, using raw text:', parseError)
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawText: rawText,
      documentType: documentType
    })

  } catch (error: any) {
    console.error('OCR API error:', error)
    
    // Handle specific OpenAI errors
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key',
          code: 'INVALID_API_KEY'
        }, 
        { status: 401 }
      )
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'OpenAI API quota exceeded',
          code: 'QUOTA_EXCEEDED'
        }, 
        { status: 429 }
      )
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { 
          error: 'OpenAI API rate limit exceeded',
          code: 'RATE_LIMIT'
        }, 
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 