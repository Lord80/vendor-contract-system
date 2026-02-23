import fitz  # PyMuPDF
import re
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from PDF file.
    Includes basic cleaning to remove header/footer noise and validation.
    """
    text_blocks = []
    
    try:
        with fitz.open(file_path) as doc:
            num_pages = len(doc)
            
            for page in doc:
                text = page.get_text("text")
                # Basic cleaning: remove excessive whitespace and control characters
                text = re.sub(r'\s+', ' ', text).strip()
                if text:
                    text_blocks.append(text)
                    
        full_text = " ".join(text_blocks)
        
        # Validation: If a multi-page PDF yields almost no text, it's likely a scan/image
        if not full_text or (len(full_text) < 50 and num_pages > 1):
            raise ValueError("PDF contains no extractable text. It might be a scanned image. OCR is required.")
            
        return full_text
        
    except fitz.FileDataError:
        logger.error(f"Invalid or corrupted PDF file: {file_path}")
        raise ValueError("The provided file is corrupted or not a valid PDF.")
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {e}")
        raise ValueError(f"Failed to process PDF: {str(e)}")