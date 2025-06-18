import sys
import PyPDF2

def unlock_pdf(input_path, output_path, password):
    try:
        # Open the PDF file
        with open(input_path, 'rb') as file:
            # Create PDF reader object
            reader = PyPDF2.PdfReader(file)
            
            # Check if PDF is encrypted
            if reader.is_encrypted:
                # Try to decrypt with password
                if reader.decrypt(password) == 0:
                    raise Exception("Incorrect password")
                
                # Create PDF writer object
                writer = PyPDF2.PdfWriter()
                
                # Add all pages to the writer
                for page in reader.pages:
                    writer.add_page(page)
                
                # Write the unlocked PDF to output file
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
            else:
                raise Exception("PDF is not password protected")
                
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python unlock_pdf.py <input_pdf> <output_pdf> <password>", file=sys.stderr)
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    password = sys.argv[3]
    
    unlock_pdf(input_path, output_path, password) 