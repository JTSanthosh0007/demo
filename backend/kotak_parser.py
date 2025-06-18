import pandas as pd
import re
from datetime import datetime
import logging
import fitz  # PyMuPDF
import io

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KotakParser:
    def __init__(self, file, filename):
        self.file_obj = file
        
    def parse(self):
        """Parse Kotak bank statement PDF"""
        doc = None
        try:
            # Ensure the stream is at the beginning before reading
            self.file_obj.seek(0)
            
            # Open the PDF directly from the file-like object
            doc = fitz.open(stream=self.file_obj, filetype="pdf")
            all_extracted_text = []
            
            # Extract text from each page
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                if text and text.strip():
                    all_extracted_text.append(text)
            
            # Combine all text
            full_text = "\n".join(all_extracted_text)
            
            # Extract transactions
            transactions = self._extract_transactions(full_text)
            
            if transactions:
                # Create DataFrame
                df = pd.DataFrame(transactions)
                
                # Clean data
                df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
                df = df[df['amount'].abs() > 0]
                df = df.drop_duplicates(subset=['date', 'amount', 'description'])
                df = df.sort_values('date')
                
                # Convert date to datetime
                df['date'] = pd.to_datetime(df['date'])
                
                logger.info(f"Successfully extracted {len(df)} transactions from Kotak statement.")
                return df
            else:
                logger.error("No transactions could be extracted from Kotak statement.")
                return pd.DataFrame(columns=['date', 'amount', 'description', 'category'])
                
        except Exception as e:
            logger.error(f"Error parsing Kotak PDF: {str(e)}")
            raise
        finally:
            if doc:
                doc.close()
                
    def _extract_transactions(self, text):
        """Extract transactions from Kotak statement text"""
        transactions = []
        
        # Kotak-specific patterns - multiple patterns to catch different formats
        patterns = [
            # Pattern 1: Standard Kotak format with date, narration, reference, withdrawal/deposit, balance
            re.compile(
                r'(\d{2}-\d{2}-\d{4})\s+'  # Date (DD-MM-YYYY)
                r'([^\n]+?)\s+'  # Description/Narration (non-greedy)
                r'([A-Z0-9]+)?\s+'  # Reference number (optional)
                r'([\d,]+\.\d{2})?\s*'  # Withdrawal amount (optional)
                r'([\d,]+\.\d{2})?\s*'  # Deposit amount (optional)
                r'([\d,]+\.\d{2})',  # Balance
                re.MULTILINE
            ),
            
            # Pattern 2: Alternative format with explicit Dr/Cr markers
            re.compile(
                r'(\d{2}-\d{2}-\d{4})\s+'  # Date
                r'([^\n]+?)\s+'  # Description
                r'([\d,]+\.\d{2})\s*\((\w{2})\)',  # Amount with Dr/Cr indicator
                re.MULTILINE
            ),
            
            # Pattern 3: Format with date at start of line
            re.compile(
                r'^(\d{2}-\d{2}-\d{4})\s+'  # Date at start of line
                r'([^\n]+?)\s+'  # Description
                r'(?:.*?)\s+'  # Skip any middle content
                r'([\d,]+\.\d{2})\s*\((\w{2})\)',  # Amount with Dr/Cr
                re.MULTILINE
            ),
            
            # Pattern 4: Format with UPI references
            re.compile(
                r'(\d{2}-\d{2}-\d{4})\s+'  # Date
                r'(UPI-[^\n]+?|IMPS-[^\n]+?|NEFT-[^\n]+?|ATM-[^\n]+?)\s+'  # UPI/IMPS/NEFT transactions
                r'(?:.*?)\s+'  # Skip any middle content
                r'([\d,]+\.\d{2})\s*\((\w{2})\)',  # Amount with Dr/Cr
                re.MULTILINE
            )
        ]
        
        for pattern in patterns:
            matches = pattern.finditer(text)
            for match in matches:
                try:
                    # Extract based on pattern type
                    if len(match.groups()) >= 6:  # Pattern 1
                        date_str = match.group(1)
                        description = match.group(2).strip()
                        withdrawal = match.group(4)
                        deposit = match.group(5)
                        
                        if withdrawal and withdrawal.strip():
                            amount = -float(withdrawal.replace(',', ''))
                        elif deposit and deposit.strip():
                            amount = float(deposit.replace(',', ''))
                        else:
                            continue  # Skip if no amount
                            
                    elif len(match.groups()) >= 4:  # Pattern 2 or 3 or 4
                        date_str = match.group(1)
                        description = match.group(2).strip()
                        amount_str = match.group(3).replace(',', '')
                        txn_type = match.group(4).upper()
                        
                        amount = float(amount_str)
                        if txn_type == 'DR':
                            amount = -amount
                    else:
                        continue  # Skip if pattern doesn't match expected format
                    
                    date = self._parse_date(date_str)
                    
                    transactions.append({
                        'date': date,
                        'amount': amount,
                        'description': description,
                        'category': self._categorize_transaction(description)
                    })
                except Exception as e:
                    logger.warning(f"Could not process Kotak transaction: {e}")
        
        return transactions
    
    def _parse_date(self, date_str):
        """Parse date string (DD-MM-YYYY format)"""
        try:
            return datetime.strptime(date_str, '%d-%m-%Y')
        except:
            try:
                return datetime.strptime(date_str, '%d/%m/%Y')
            except:
                return datetime.now()
    
    def _categorize_transaction(self, description):
        """Categorize transaction based on description with India-specific categories"""
        description = description.lower()
        
        categories = {
            # Food & Dining
            'food': ['restaurant', 'food', 'swiggy', 'zomato', 'uber eats', 'dining', 'pizza', 'burger', 
                    'cafe', 'dhaba', 'tiffin', 'mess', 'canteen', 'chai', 'tea', 'coffee', 'biryani', 
                    'dosa', 'idli', 'paratha', 'thali', 'darshini', 'hotel', 'bakery', 'kfc', 'mcdonald',
                    'dominos', 'subway', 'haldiram', 'bikanervala'],
            
            # Shopping
            'shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'tatacliq', 'meesho', 'snapdeal', 
                        'bigbasket', 'grofers', 'blinkit', 'reliance retail', 'dmart', 'big bazaar', 
                        'lifestyle', 'shoppers stop', 'westside', 'pantaloons', 'mall', 'market', 'kirana',
                        'grocery', 'supermarket', 'hypermarket', 'departmental store', 'retail'],
            
            # Travel & Transport
            'travel': ['uber', 'ola', 'rapido', 'meru', 'irctc', 'railways', 'makemytrip', 'goibibo', 
                      'yatra', 'redbus', 'abhibus', 'metro', 'bus', 'auto', 'rickshaw', 'taxi', 
                      'flight', 'train', 'petrol', 'diesel', 'fuel', 'fastag', 'toll', 'parking'],
            
            # Bills & Utilities
            'bills': ['electricity', 'bijli', 'water', 'paani', 'gas', 'internet', 'wifi', 'broadband', 
                    'jio', 'airtel', 'vi', 'bsnl', 'tata sky', 'dish tv', 'dth', 'recharge', 'bill pay', 
                    'mobile', 'postpaid', 'prepaid', 'cylinder', 'maintenance', 'society'],
            
            # Entertainment
            'entertainment': ['movie', 'cinema', 'pvr', 'inox', 'netflix', 'prime', 'hotstar', 'sony liv', 
                            'zee5', 'bookmyshow', 'ticket', 'concert', 'event', 'subscription'],
            
            # Finance & Banking
            'finance': ['emi', 'loan', 'interest', 'insurance', 'premium', 'lic', 'mutual fund', 'sip', 
                       'investment', 'deposit', 'fd', 'rd', 'credit card', 'debit card', 'bank charges', 
                       'fee', 'penalty', 'tax', 'gst', 'income tax', 'tds', 'ecs', 'nach', 'auto debit',
                       'standing instruction', 'si', 'mandate', 'autopay'],
            
            # Health & Medical
            'health': ['hospital', 'doctor', 'clinic', 'medical', 'medicine', 'pharmacy', 'apollo', 
                      'medplus', 'netmeds', 'pharmeasy', 'diagnostic', 'test', 'lab', 'health', 
                      'consultation', 'treatment', 'therapy', 'dental', 'ayurveda', 'yoga'],
            
            # Education
            'education': ['school', 'college', 'university', 'institute', 'class', 'tuition', 'coaching', 
                         'course', 'training', 'workshop', 'books', 'stationery', 'fees', 'education', 
                         'byju', 'unacademy', 'vedantu', 'exam', 'test series'],
            
            # Transfers & Payments
            'transfer': ['transfer', 'sent', 'received', 'payment', 'upi', 'neft', 'rtgs', 'imps',
                        'withdraw', 'deposit', 'cash', 'atm', 'cheque', 'dd', 'pay to', 'received from',
                        'trf', 'chq', 'vpa', 'paytm', 'phonepe', 'gpay', 'google pay', 'amazon pay',
                        'fund transfer', 'money transfer', 'account transfer', 'self transfer']
        }
        
        # Special handling for Kotak-specific descriptions
        if 'upi-' in description or 'upi/' in description:
            return 'transfer'
        if 'imps-' in description or 'neft-' in description:
            return 'transfer'
        if 'atm-' in description or 'atm/' in description or 'atm ' in description:
            return 'transfer'
        if 'pos/' in description or 'pos-' in description:
            return 'shopping'
        if 'ecs/' in description or 'nach/' in description:
            return 'finance'
        if 'salary' in description or 'sal/' in description:
            return 'income'
        
        # Check regular categories
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in description:
                    return category
                    
        return 'miscellaneous expenses' 