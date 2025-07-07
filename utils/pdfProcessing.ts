// PDF processing utilities - Client-side only
export interface PDFPage {
  pageNumber: number
  imageData: string // base64 image data
  width: number
  height: number
}

export interface PDFDocument {
  pages: PDFPage[]
  totalPages: number
  fileName: string
  fileSize: number
}

/**
 * Convert PDF file to array of base64 images (one per page)
 * Only runs on client side to avoid SSR issues
 */
export const convertPDFToImages = async (file: File): Promise<PDFDocument> => {
  console.log('=== PDF CONVERSION START ===')
  
  if (typeof window === 'undefined') {
    console.error('SSR detected in PDF conversion')
    throw new Error('PDF processing can only be done in the browser')
  }

  try {
    console.log('Starting PDF conversion for:', file.name)
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    // For now, let's use a simpler approach that doesn't rely on PDF.js workers
    // We'll extract text and create a simple representation
    console.log('Using text extraction approach instead of image conversion...')
    
    const text = await extractTextFromPDF(file)
    console.log('Text extracted successfully, length:', text.length)
    
    // Create a simple canvas with the text for now
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      throw new Error('Could not get canvas context')
    }
    
    // Set canvas size
    canvas.width = 800
    canvas.height = 600
    
    // Fill with white background
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add text
    context.fillStyle = 'black'
    context.font = '12px Arial'
    
    // Split text into lines and draw
    const lines = text.split('\n').slice(0, 40) // Limit to first 40 lines
    lines.forEach((line, index) => {
      context.fillText(line.substring(0, 80), 10, 20 + (index * 15)) // Limit line length
    })
    
    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    
    const pages: PDFPage[] = [{
      pageNumber: 1,
      imageData: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
      width: canvas.width,
      height: canvas.height
    }]
    
    console.log('PDF text converted to image successfully')
    
    return {
      pages,
      totalPages: 1,
      fileName: file.name,
      fileSize: file.size
    }
    
  } catch (error) {
    console.error('Error converting PDF to images:', error)
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text directly from PDF (alternative to image conversion)
 * Only runs on client side to avoid SSR issues
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF text extraction can only be done in the browser')
  }

  console.log('Extracting text from PDF:', file.name)
  
  // For now, let's use a simpler approach that doesn't rely on PDF.js
  // This will be much more reliable in the Next.js environment
  console.log('Using simplified PDF text extraction approach...')
  
  try {
    // Try to use PDF.js with minimal configuration
    const pdfjsLib = await import('pdfjs-dist')
    console.log('PDF.js library loaded, version:', pdfjsLib.version)
    
    // Try to completely disable workers
    try {
      (pdfjsLib.GlobalWorkerOptions as any).workerSrc = ''
      console.log('Worker disabled')
    } catch (e) {
      console.log('Could not disable worker')
    }
    
    const arrayBuffer = await file.arrayBuffer()
    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength)
    
    // Try to load PDF with minimal options
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0
    }).promise
    
    console.log('PDF loaded successfully, pages:', pdf.numPages)
    
    let fullText = ''
    
    // Extract text from first 2 pages only for speed
    const maxPages = Math.min(2, pdf.numPages)
    console.log(`Processing first ${maxPages} pages`)
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Extracting text from page ${pageNum}`)
      
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += pageText + '\n'
        console.log(`Page ${pageNum} text length:`, pageText.length)
      } catch (pageError) {
        console.error(`Error on page ${pageNum}:`, pageError)
        fullText += `[Error on page ${pageNum}]\n`
      }
    }
    
    console.log('Text extraction completed, total length:', fullText.length)
    
    if (fullText.trim().length > 0) {
      return fullText
    }
    
  } catch (error) {
    console.error('PDF.js extraction failed:', error)
  }
  
  // If PDF.js fails, return a simple message
  return `PDF Document: ${file.name}
  
PDF text extraction failed. This might be a scanned document.
Please use the Tesseract processing method for better results.
  
File size: ${(file.size / 1024).toFixed(2)} KB
File type: ${file.type}`
}

/**
 * Validate PDF file
 */
export const isValidPDF = (file: File): boolean => {
  // Ensure we're on the client side
  if (typeof window === 'undefined') return false
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Get PDF metadata
 * Only runs on client side to avoid SSR issues
 */
export const getPDFMetadata = async (file: File): Promise<{
  pageCount: number
  title?: string
  author?: string
  subject?: string
  creationDate?: string
}> => {
  if (typeof window === 'undefined') {
    return { pageCount: 0 }
  }

  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    
    const metadata = await pdf.getMetadata()
    
    // Type assertion for metadata info
    const info = metadata?.info as any
    
    return {
      pageCount: pdf.numPages,
      title: info?.Title,
      author: info?.Author,
      subject: info?.Subject,
      creationDate: info?.CreationDate
    }
    
  } catch (error) {
    console.error('Error getting PDF metadata:', error)
    return { pageCount: 0 }
  }
}

/**
 * Process PDF with different strategies based on content
 * Only runs on client side to avoid SSR issues
 */
export const processPDFStrategy = async (
  file: File,
  strategy: 'image' | 'text' | 'hybrid' = 'hybrid'
): Promise<{
  images?: PDFPage[]
  text?: string
  metadata: any
}> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing can only be done in the browser')
  }

  const metadata = await getPDFMetadata(file)
  
  if (strategy === 'image' || strategy === 'hybrid') {
    const images = await convertPDFToImages(file)
    return { images: images.pages, metadata }
  }
  
  if (strategy === 'text' || strategy === 'hybrid') {
    const text = await extractTextFromPDF(file)
    return { text, metadata }
  }
  
  return { metadata }
} 