import pandas as pd
import plotly.express as px
import pdfplumber
from pathlib import Path
import io
import re
from pdfminer.layout import LAParams
import PyPDF2
import fitz  #  PyMuPDF
import traceback  # Import traceback for detailed error logging
import logging  # Import logging for error handling
import plotly.graph_objects as go
from datetime import datetime
import json
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StatementParser:
    def __init__(self, file_path):
        self.file_path = file_path
        self.filename = Path(file_path).name

    def parse(self):
        """Parse the uploaded file into a standardized DataFrame"""
        if self.filename.endswith('.pdf'):
            return self._parse_pdf()
        else:
            raise ValueError("Unsupported file format")

    def _parse_pdf(self):
        """Handle PDF parsing with extra security checks"""
        debug_info = []
        
        try:
            # First try to validate if it's a valid PDF
            try:
                pdf_reader = PyPDF2.PdfReader(self.file_path)
                num_pages = len(pdf_reader.pages)
                logger.info(f"PDF has {num_pages} pages")
            except Exception as e:
                logger.error(f"PDF validation error: {str(e)}")
                return pd.DataFrame({
                    'date': [pd.Timestamp.now()], 
                    'amount': [0.0],
                    'category': ['Others']
                })

            # Process in chunks of 10 pages to avoid memory issues
            all_transactions = []
            parsing_errors = []
            chunk_size = 10
            
            with pdfplumber.open(self.file_path) as pdf:
                total_pages = len(pdf.pages)
                
                if total_pages == 0:
                    logger.error("The PDF file appears to be empty.")
                    return pd.DataFrame({
                        'date': [pd.Timestamp.now()], 
                        'amount': [0.0],
                        'category': ['Others']
                    })

                logger.info(f"Processing PDF with {total_pages} pages")
                
                # Process pages in chunks
                for start_page in range(0, total_pages, chunk_size):
                    end_page = min(start_page + chunk_size, total_pages)
                    logger.info(f"Processing pages {start_page + 1} to {end_page}")
                    
                    chunk_text = ""
                    chunk_transactions = []
                    
                    # Extract text from current chunk of pages
                    for page_num in range(start_page, end_page):
                        try:
                            page = pdf.pages[page_num]
                            text = page.extract_text()
                            
                            if not text:
                                logger.info(f"No text on page {page_num + 1}, trying PyMuPDF")
                                text = self._extract_text_with_pymupdf(self.file_path, page_num + 1)
                            
                            if text:
                                chunk_text += text + "\n"
                            else:
                                parsing_errors.append(f"Page {page_num + 1}: No text could be extracted")
                                continue
                                
                        except Exception as e:
                            logger.error(f"Error on page {page_num + 1}: {str(e)}")
                            parsing_errors.append(f"Page {page_num + 1}: {str(e)}")
                            continue
                    
                    # Process the chunk text
                    if chunk_text:
                        lines = chunk_text.split('\n')
                        logger.info(f"Processing {len(lines)} lines from pages {start_page + 1}-{end_page}")
                        
                        for line_num, line in enumerate(lines, 1):
                            line = line.strip()
                            if not line:
                                continue
                            
                            # Skip header lines
                            if any(header in line.lower() for header in ['statement', 'page', 'date', 'time', 'transaction id']):
                                continue
                            
                            try:
                                # Try to extract transaction details
                                transaction = self._extract_transaction_from_line(line)
                                if transaction:
                                    chunk_transactions.append(transaction)
                            except Exception as e:
                                logger.error(f"Error processing line {line_num}: {str(e)}")
                                continue
                    
                    # Add chunk transactions to main list
                    all_transactions.extend(chunk_transactions)
                    logger.info(f"Added {len(chunk_transactions)} transactions from chunk")
                    
                    # Clear chunk data to free memory
                    chunk_text = ""
                    chunk_transactions = []

                if not all_transactions:
                    if parsing_errors:
                        error_msg = "\n".join(parsing_errors)
                        logger.error(f"Could not extract transactions. Errors encountered:\n{error_msg}")
                    else:
                        logger.error("No valid transactions found in the PDF.")
                    return pd.DataFrame({
                        'date': [pd.Timestamp.now()], 
                        'amount': [0.0],
                        'category': ['Others']
                    })

                # Create DataFrame and sort by date
                df = pd.DataFrame(all_transactions)
                df = df.sort_values('date', ascending=False)
                
                # Log summary
                logger.info(f"Successfully extracted {len(df)} transactions")
                logger.info(f"Total credits: {df[df['amount'] > 0]['amount'].sum():.2f}")
                logger.info(f"Total debits: {df[df['amount'] < 0]['amount'].sum():.2f}")
                
                return df

        except Exception as e:
            error_msg = f"Error processing PDF: {str(e)}"
            logger.error(error_msg)
            return pd.DataFrame({
                'date': [pd.Timestamp.now()], 
                'amount': [0.0],
                'category': ['Others']
            })

    def _extract_transaction_from_line(self, line):
        """Extract transaction details from a single line of text"""
        # Pattern 1: Date at start, amount at end
        pattern1 = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}).*?((?:CREDIT|DEBIT|Paid|Received)).*?(?:₹|Rs|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        # Pattern 2: Date with time
        pattern2 = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*(.*?)(?:₹|Rs|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        # Pattern 3: Simplified date and amount
        pattern3 = r'(\d{1,2}/\d{1,2}/\d{4}).*?(?:₹|Rs|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        match = None
        amount_str = None
        date_str = None
        description = None
        txn_type = None
        
        # Try each pattern
        if re.search(pattern1, line, re.IGNORECASE):
            match = re.search(pattern1, line, re.IGNORECASE)
            date_str = match.group(1)
            txn_type = match.group(2)
            amount_str = match.group(3)
            description = line
        elif re.search(pattern2, line, re.IGNORECASE):
            match = re.search(pattern2, line, re.IGNORECASE)
            date_str = match.group(1)
            description = match.group(3)
            amount_str = match.group(4)
            txn_type = 'CREDIT' if 'credit' in line.lower() else 'DEBIT'
        elif re.search(pattern3, line, re.IGNORECASE):
            match = re.search(pattern3, line, re.IGNORECASE)
            date_str = match.group(1)
            amount_str = match.group(2)
            description = line
            txn_type = 'CREDIT' if 'credit' in line.lower() else 'DEBIT'
        
        if match and amount_str:
            # Clean amount string
            amount = float(amount_str.replace(',', ''))
            
            # Determine transaction type
            is_debit = any(word in line.lower() for word in ['debit', 'paid', 'payment', 'withdraw'])
            if is_debit:
                amount = -amount
            
            # Parse date
            if '/' in date_str:
                date = pd.to_datetime(date_str, format='%d/%m/%Y')
            else:
                date = pd.to_datetime(date_str)
            
            return {
                'date': date,
                'amount': amount,
                'description': description.strip() if description else 'Transaction',
                'category': self._categorize_transaction(description if description else ''),
                'type': 'DEBIT' if is_debit else 'CREDIT'
            }
        
        return None

    def _extract_text_with_pymupdf(self, pdf_path, page_num):
        """Extract text from a specific page using PyMuPDF"""
        try:
            doc = fitz.open(pdf_path)
            page = doc[page_num - 1]
            text = page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.error(f"PyMuPDF extraction error: {str(e)}")
            return ""

    def _categorize_transaction(self, description):
        """Categorize transaction based on description"""
        description = description.lower()
        
        categories = {
            'Food & Dining': ['food', 'restaurant', 'cafe', 'coffee', 'swiggy', 'zomato', 'hotel'],
            'Shopping': ['amazon', 'flipkart', 'myntra', 'shop', 'store', 'retail'],
            'Transportation': ['uber', 'ola', 'metro', 'bus', 'train', 'flight', 'airline'],
            'Entertainment': ['movie', 'theatre', 'netflix', 'prime', 'hotstar'],
            'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'mobile', 'phone'],
            'Health & Medical': ['hospital', 'clinic', 'pharmacy', 'medical', 'doctor'],
            'Education': ['school', 'college', 'university', 'course', 'training'],
            'Travel': ['hotel', 'booking', 'trip', 'travel', 'tour'],
            'Personal Care': ['salon', 'spa', 'beauty', 'gym', 'fitness'],
            'Investments': ['investment', 'mutual fund', 'stock', 'share', 'equity'],
            'Insurance': ['insurance', 'policy', 'premium'],
            'Rent': ['rent', 'lease', 'property'],
            'Salary': ['salary', 'income', 'payment received'],
            'Others': []
        }
        
        for category, keywords in categories.items():
            if any(keyword in description for keyword in keywords):
                return category
        
        return 'Others'

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide a PDF file path"}))
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        parser = StatementParser(file_path)
        df = parser.parse()
        
        if df.empty or len(df) == 1 and df.iloc[0]['amount'] == 0:
            print(json.dumps({"error": "No valid transactions found in the PDF"}))
            sys.exit(1)
        
        logger.info("Calculating summary statistics...")
        # Calculate summary statistics
        total_received = df[df['amount'] > 0]['amount'].sum()
        total_spent = df[df['amount'] < 0]['amount'].sum()
        credit_count = len(df[df['amount'] > 0])
        debit_count = len(df[df['amount'] < 0])
        logger.info("Summary statistics calculated.")
        
        logger.info("Calculating category breakdown...")
        # Calculate category breakdown
        category_breakdown = {}
        for category in df['category'].unique():
            logger.info(f"Processing category: {category}")
            category_amount = df[df['category'] == category]['amount'].sum()
            category_count = len(df[df['category'] == category])
            category_breakdown[category] = {
                'amount': category_amount,
                'percentage': (abs(category_amount) / abs(total_spent)) * 100 if total_spent != 0 else 0,
                'count': category_count
            }
        logger.info("Category breakdown calculated.")

        logger.info("Preparing chart data...")
        # Prepare chart data
        chart_data = {
            'data': {
                'labels': list(category_breakdown.keys()),
                'datasets': [{
                    'data': [abs(cat['amount']) for cat in category_breakdown.values()],
                    'backgroundColor': [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                    ]
                }]
            }
        }
        logger.info("Chart data prepared.")

        logger.info("Preparing final response...")
        # Convert Timestamp objects to ISO format strings
        df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        # Prepare response
        response = {
            'transactions': df.to_dict('records'),
            'summary': {
                'totalReceived': total_received,
                'totalSpent': total_spent,
                'balance': total_received + total_spent,
                'creditCount': credit_count,
                'debitCount': debit_count,
                'totalTransactions': len(df)
            },
            'categoryBreakdown': category_breakdown,
            'chartData': chart_data,
            'pageCount': len(PyPDF2.PdfReader(file_path).pages)
        }
        logger.info("Final response prepared.")

        logger.info("Printing JSON response...")
        print(json.dumps(response))
        logger.info("JSON response printed.")
        
    except Exception as e:
        logger.error(f"Exception in main execution: {e}")
        print(json.dumps({
            "error": str(e),
            "details": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 