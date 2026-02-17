import fitz  # PyMuPDF
import re

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from PDF file.
    Includes basic cleaning to remove header/footer noise.
    """
    text_blocks = []
    
    try:
        with fitz.open(file_path) as doc:
            for page in doc:
                text = page.get_text()
                # Basic cleaning: remove excessive whitespace
                text = re.sub(r'\s+', ' ', text).strip()
                if text:
                    text_blocks.append(text)
                    
        full_text = " ".join(text_blocks)
        
        if not full_text:
            raise ValueError("PDF contains no extractable text (might be an image scan).")
            
        return full_text
        
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
        return ""