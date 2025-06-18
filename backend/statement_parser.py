import pandas as pd
import pdfplumber
from pathlib import Path
import io
import re
from datetime import datetime
import json
import sys
import argparse
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StatementParser:
    def __init__(self, file, filename):
        self.file = file
        self.filename = filename

    def parse(self):
        """Parse the file into a standardized DataFrame"""
        if self.filename.endswith('.pdf'):
            return self._parse_pdf()
        else:
            raise ValueError("Unsupported file format")

    def _parse_pdf(self):
        """
        Robustly parse tables from a PDF to extract transaction data.
        This method uses a hybrid approach, trying table extraction first
        and falling back to text-based regex if needed.
        """
        logger.info(f"Starting PDF parsing for {self.filename}")
        transactions = []
        
        try:
            self.file.seek(0)
            
            # Heuristic to select the right parser based on filename
            if 'phonepe' in self.filename.lower():
                logger.info("PhonePe statement detected. Using PhonePe-specific parser.")
                return self._parse_phonepe_pdf()

            # Default generic parser
            with pdfplumber.open(self.file) as pdf:
                transactions = self._parse_pdf_tables(pdf)
                if not transactions:
                    logger.warning("Table-based parsing yielded no results. Attempting text-based fallback.")
                    transactions = self._parse_pdf_text(pdf)

            if transactions:
                final_df = pd.DataFrame(transactions)
                final_df = final_df[~final_df['description'].str.contains('balance', case=False, na=False)]
                final_df = final_df.drop_duplicates().sort_values('date').reset_index(drop=True)
                logger.info(f"Successfully parsed {len(final_df)} transactions in total.")
                return final_df
            else:
                logger.error("All parsing methods failed. No transactions could be extracted.")
                return pd.DataFrame(columns=['date', 'amount', 'description', 'category'])
        except Exception as e:
            logger.error(f"A critical error occurred during PDF parsing: {e}", exc_info=True)
            return pd.DataFrame(columns=['date', 'amount', 'description', 'category'])

    def _parse_phonepe_pdf(self):
        """Dedicated parser for PhonePe statements with multiple regex fallbacks."""
        transactions = []
        # A list of regex patterns tailored for different PhonePe statement formats
        phonepe_patterns = [
            # Pattern 1: For transfers (sent to/paid to/received from)
            re.compile(
                r"(?P<description>(?:Sent to|Paid to|Received from) [^\n]+)\n"
                r"(?P<date>\d{1,2} \w{3} \d{4}, \d{1,2}:\d{2} [AP]M)\n"
                r"Transaction ID \d+\n"
                r"₹ (?P<amount>[\d,]+\.\d{2})",
                re.MULTILINE
            ),
            # Pattern 2: For cashback and other simple entries
            re.compile(
                r"(?P<description>Cashback Received|Payment for \w+)\n"
                r"(?P<date>\d{1,2} \w{3} \d{4}, \d{1,2}:\d{2} [AP]M)\n"
                r"Transaction ID \d+\n"
                r"₹ (?P<amount>[\d,]+\.\d{2})",
                re.MULTILINE
            ),
             # Pattern 3: More generic pattern to catch other formats
            re.compile(
                r"(?P<description>.*?)\n"
                r"(?P<date>\d{1,2} \w{3} \d{4}, \d{1,2}:\d{2} [AP]M)\n"
                r"(?:.*?)\n"
                r"₹ (?P<amount>[\d,]+\.\d{2})",
                re.MULTILINE
            )
        ]

        try:
            with pdfplumber.open(self.file) as pdf:
                full_text = "".join(page.extract_text() for page in pdf.pages if page.extract_text())
                # Add logging to see the extracted text for debugging
                logger.info("--- Extracted PhonePe PDF Text ---")
                logger.info(full_text)
                logger.info("------------------------------------")

            for pattern in phonepe_patterns:
                matches = pattern.finditer(full_text)
                for match in matches:
                    data = match.groupdict()
                    description = data['description'].strip()
                    amount_str = data['amount'].replace(',', '')
                    
                    # Determine if it's a debit or credit
                    if any(keyword in description for keyword in ['Sent to', 'Paid to']):
                        amount = -abs(float(amount_str))
                    else: # Assumes 'Received from', 'Cashback', etc. are credits
                        amount = abs(float(amount_str))

                    # Parse date (format: 15 Jan 2024, 08:30 PM)
                    date = datetime.strptime(data['date'], '%d %b %Y, %I:%M %p')

                    transactions.append({
                        'date': date,
                        'amount': amount,
                        'description': description,
                        'category': self._categorize_transaction(description)
                    })
                
                # If we found transactions with the current pattern, we can stop.
                if transactions:
                    logger.info(f"Found {len(transactions)} transactions with pattern: {pattern.pattern}")
                    break
        
        except Exception as e:
            logger.error(f"Error during PhonePe parsing: {e}", exc_info=True)
            return pd.DataFrame() # Return empty df on error

        if not transactions:
            logger.warning("No transactions found using any of the PhonePe regex patterns.")
            return pd.DataFrame()

        return pd.DataFrame(transactions).sort_values('date').reset_index(drop=True)

    def _parse_pdf_tables(self, pdf):
        """Primary parsing method: Extracts data from structured tables."""
        transactions = []
        try:
            for i, page in enumerate(pdf.pages):
                logger.info(f"TABLE PARSE: Processing page {i + 1}/{len(pdf.pages)}")
                
                tables = page.extract_tables()
                if not tables:
                    continue

                for table_num, table in enumerate(tables):
                    if not table:
                        continue

                    df = pd.DataFrame(table)
                    
                    header_keywords = ['date', 'transaction', 'narration', 'description', 'details', 'chq', 'ref', 'withdrawal', 'deposit', 'amount', 'balance']
                    header_row_index = -1
                    for row_idx, row in df.iterrows():
                        row_str = ' '.join(map(str, row.values)).lower()
                        if any(keyword in row_str for keyword in header_keywords):
                            header_row_index = row_idx
                            break
                    
                    if header_row_index == -1:
                        continue
                        
                    header = [str(h).lower().strip() for h in df.iloc[header_row_index]]
                    df.columns = header
                    data_df = df.iloc[header_row_index + 1:].reset_index(drop=True)

                    date_col = next((c for c in header if 'date' in c), None)
                    desc_col = next((c for c in header if any(k in c for k in ['narration', 'description', 'transaction details'])), None)
                    withdrawal_col = next((c for c in header if any(k in c for k in ['withdrawal', 'debit', 'dr.'])), None)
                    deposit_col = next((c for c in header if any(k in c for k in ['deposit', 'credit', 'cr.'])), None)

                    if not all([date_col, desc_col, withdrawal_col, deposit_col]):
                        continue

                    for _, row in data_df.iterrows():
                        try:
                            date = self._parse_date(row[date_col])
                            description = row[desc_col]
                            
                            withdrawal_str = str(row.get(withdrawal_col) or '0').replace(',', '').strip()
                            deposit_str = str(row.get(deposit_col) or '0').replace(',', '').strip()

                            amount = 0
                            if withdrawal_str and float(withdrawal_str) > 0:
                                amount = -abs(float(withdrawal_str))
                            elif deposit_str and float(deposit_str) > 0:
                                amount = abs(float(deposit_str))
                            
                            if description and amount != 0:
                                transactions.append({
                                    'date': date,
                                    'amount': amount,
                                    'description': str(description).strip(),
                                    'category': self._categorize_transaction(str(description))
                                })
                        except (ValueError, TypeError):
                            continue
            return transactions
        except Exception as e:
            logger.error(f"A critical error occurred during TABLE parsing: {e}", exc_info=True)
            return []

    def _parse_pdf_text(self, pdf):
        """Fallback parsing method: Extracts data from raw text using regex."""
        transactions = []
        pattern = re.compile(
            r"(?P<date>(?:\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4})|(?:\d{2}-\d{2}-\d{4}))"
            r"\s+(?P<description>.*?)\s+"
            r"(?P<amount>-?₹?\s?[\d,]+\.\d{2})"
        )
        try:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if not text:
                    continue
                
                lines = text.strip().split('\n')
                
                for line in lines:
                    match = pattern.search(line)
                    if match:
                        try:
                            data = match.groupdict()
                            date = self._parse_date(data.get('date'))
                            description = data['description'].strip()
                            amount_str = data['amount'].replace('₹', '').replace(',', '').strip()
                            amount = float(amount_str)

                            if any(keyword in description.lower() for keyword in ['balance', 'opening', 'statement from']):
                                continue

                            if description and amount != 0:
                                transactions.append({
                                    'date': date,
                                    'amount': amount,
                                    'description': description,
                                    'category': self._categorize_transaction(description)
                                })
                        except (ValueError, TypeError):
                            continue
            return transactions
        except Exception as e:
            logger.error(f"A critical error occurred during TEXT parsing: {e}", exc_info=True)
            return []

    def _parse_date(self, date_str):
        """Parse date string into datetime object"""
        try:
            if not date_str:
                # Fallback to current date if none is found in the line
                return datetime.now()

            date_str = date_str.strip()
            date_formats = [
                '%d %b %Y',      # 06 Nov 2024
                '%b %d %Y',      # Nov 06 2024
                '%d %B %Y',      # 06 November 2024
                '%B %d %Y',      # November 06 2024
                '%m/%d/%Y',      # 11/06/2024
                '%d/%m/%Y',      # 06/11/2024
                '%Y-%m-%d',      # 2024-11-06
                '%d-%m-%Y',      # 06-11-2024
                '%b %d, %Y',     # Nov 06, 2024
                '%d %b, %Y',     # 06 Nov, 2024
                '%d-%b-%Y',      # 06-Nov-2024
                '%b-%d-%Y'       # Nov-06-2024
            ]
            
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    # Simple heuristic to handle years in the future
                    if parsed_date.year > datetime.now().year:
                        parsed_date = parsed_date.replace(year=datetime.now().year)
                    return parsed_date
                except ValueError:
                    continue
            
            # Fallback for ambiguous formats
            components = re.findall(r'\d+', date_str)
            if len(components) >= 3:
                day, month, year = map(int, components[:3])
                if year < 100:
                    year += 2000 # Assume 21st century
                if month > 12: # Swap day and month if month is invalid
                    day, month = month, day
                return datetime(year, month, day)
            
            return datetime.now()
            
        except Exception:
            # If any error occurs, return today's date as a failsafe
            return datetime.now()

    def _categorize_transaction(self, description):
        """Enhanced transaction categorization with comprehensive India-specific terms"""
        description = description.lower()
        
        categories = {
            # Food & Dining - Indian Restaurants & Food Services
            'food': [
                'barbeque nation', 'burger king', 'cafe coffee day', 'ccd', 'dominos', 'haldiram', 
                'kfc', 'mcdonalds', 'pizza hut', 'subway', 'wow momo', 'biryani blues', 'biryani by kilo',
                'behrouz biryani', 'faasos', 'oven story', 'paradise biryani', 'punjab grill', 'mainland china',
                'thali', 'dosa', 'idli', 'vada', 'sambar', 'chutney', 'paratha', 'naan', 'roti', 'chapati',
                'dal', 'paneer', 'chole', 'rajma', 'kadhi', 'sabzi', 'bhaji', 'pav', 'vada pav', 'pav bhaji',
                'misal pav', 'poha', 'upma', 'uttapam', 'appam', 'puttu', 'biryani', 'pulao', 'tandoori',
                'kebab', 'tikka', 'kathi roll', 'frankie', 'pani puri', 'golgappa', 'bhel puri', 'sev puri',
                'chaat', 'samosa', 'kachori', 'pakora', 'bhajiya', 'dhokla', 'khaman', 'thepla', 'khichdi',
                'undhiyu', 'rasam', 'sambhar', 'avial', 'porotta', 'malabar parotta', 'kothu parotta',
                'swiggy', 'zomato', 'uber eats', 'foodpanda', 'box8', 'freshmenu', 'eatfit', 'tinyowl',
                'holachef', 'inner chef', 'yumist', 'dailyninja', 'milkbasket', 'supr daily', 'doodhwala',
                'licious', 'freshtohome', 'meatigo', 'zappfresh', 'easyday', 'bigbasket', 'grofers', 'jiomart',
                'haldiram', 'bikanervala', 'aggarwal sweets', 'ganguram', 'kc das', 'mithai', 'sweet',
                'rasgulla', 'gulab jamun', 'jalebi', 'imarti', 'ladoo', 'barfi', 'peda', 'kalakand',
                'mysore pak', 'kaju katli', 'soan papdi', 'petha', 'ghevar', 'malpua', 'rabri', 'kheer',
                'payasam', 'basundi', 'kulfi', 'falooda', 'lassi', 'shrikhand', 'mishti doi', 'rasmalai'
            ],
            
            # Shopping - Indian Retail & E-commerce
            'shopping': [
                'reliance retail', 'dmart', 'big bazaar', 'future retail', 'v-mart', 'pantaloons', 'shoppers stop',
                'lifestyle', 'westside', 'central', 'brand factory', 'max', 'trends', 'reliance digital',
                'croma', 'vijay sales', 'pai international', 'girias', 'viveks', 'nilgiris', 'spencer',
                'more retail', 'nature\'s basket', 'foodhall', 'metro cash & carry', 'vishal mega mart',
                'flipkart', 'amazon', 'snapdeal', 'myntra', 'ajio', 'nykaa', 'tata cliq', 'meesho', 'limeroad',
                'pepperfry', 'urban ladder', 'firstcry', 'hopscotch', 'bigbasket', 'grofers', 'jiomart',
                'dmart', 'reliance smart', 'star bazaar', 'easyday club', 'le marche', 'modern bazaar',
                'ratnadeep', 'namdhari\'s fresh', 'daily basket', 'country delight', 'bb daily'
            ],
            
            # Travel & Transport
            'travel': [
                'uber', 'ola', 'rapido', 'meru', 'irctc', 'railways', 'redbus', 'abhibus', 'makemytrip', 
                'goibibo', 'yatra', 'cleartrip', 'ixigo', 'easemytrip', 'indigo', 'spicejet', 'air india',
                'vistara', 'goair', 'airasia', 'metro', 'bmrcl', 'dmrc', 'mmrcl', 'bus', 'auto', 'rickshaw',
                'taxi', 'cab', 'flight', 'train', 'petrol', 'diesel', 'fuel', 'fastag', 'toll', 'parking'
            ],
            
            # Bills & Utilities
            'bills': [
                'electricity', 'bescom', 'bses', 'ad-ani electricity', 'mahadiscom', 'tata power', 'cesc',
                'water', 'bwssb', 'delhi jal board', 'gas', 'lpg', 'adani gas', 'indraprastha gas', 'mahanagar gas',
                'internet', 'wifi', 'broadband', 'act fibernet', 'hathway', 'jiofiber', 'airtel xstream',
                'bsnl', 'recharge', 'bill', 'mobile', 'postpaid', 'prepaid', 'airtel', 'jio', 'vi', 'vodafone idea',
                'dth', 'tata sky', 'dish tv', 'sun direct', 'airtel digital tv', 'maintenance', 'society'
            ],
            
            # Entertainment
            'entertainment': [
                'movie', 'cinema', 'pvr', 'inox', 'cinepolis', 'bookmyshow', 'ticketnew', 'paytm movies',
                'netflix', 'amazon prime video', 'hotstar', 'disney+', 'sony liv', 'zee5', 'voot', 'altbalaji',
                'spotify', 'gaana', 'jiosaavn', 'wynk music', 'youtube premium', 'subscription', 'concert', 'event'
            ],
            
            # Finance & Banking
            'finance': [
                'emi', 'loan', 'interest', 'insurance', 'premium', 'lic', 'hdfc life', 'icici prudential',
                'sbi life', 'bajaj allianz', 'max life', 'policybazaar', 'mutual fund', 'sip', 'investment',
                'zerodha', 'groww', 'upstox', 'angel broking', '5paisa', 'etmoney', 'kuvera', 'paytm money',
                'deposit', 'fd', 'rd', 'credit card payment', 'debit card', 'bank charges', 'atm withdrawal',
                'cash withdrawal', 'fee', 'penalty', 'tax', 'gst', 'income tax', 'tds', 'ecs', 'nach',
                'auto debit', 'standing instruction', 'si', 'mandate', 'autopay', 'cheque', 'CHQ'
            ],
            
            # Health & Medical
            'health': [
                'hospital', 'doctor', 'clinic', 'medical', 'medicine', 'pharmacy', 'apollo pharmacy',
                'medplus', 'netmeds', 'pharmeasy', '1mg', 'practo', 'lal pathlabs', 'dr lal pathlabs',
                'thyrocare', 'diagnostic', 'test', 'lab', 'health checkup', 'consultation', 'treatment',
                'therapy', 'dental', 'eyecare', 'lenskart', 'ayurveda', 'homeopathy', 'yoga', 'fitness'
            ],
            
            # Education
            'education': [
                'school', 'college', 'university', 'institute', 'tuition', 'coaching', 'course', 'training',
                'byjus', 'unacademy', 'vedantu', 'coursera', 'udemy', 'edx', 'books', 'stationery', 'fees'
            ],
            
            # Transfers & Payments
            'transfer': [
                'transfer', 'sent', 'received', 'payment', 'upi', 'neft', 'rtgs', 'imps', 'to acc', 'from acc',
                'withdraw', 'deposit', 'cash', 'atm', 'vpa', 'paytm', 'phonepe', 'gpay', 'google pay',
                'amazon pay', 'cred', 'mobikwik', 'freecharge', 'bhim', 'bharatpe', 'trf', 'fund transfer'
            ],
            
            # Income
            'income': [
                'salary', 'sal', 'stipend', 'refund', 'reimbursement', 'cashback', 'credit', 'interest received'
            ],
            
            # Miscellaneous
            'misc': [
                'rent', 'donation', 'charity', 'gift', 'pet', 'grooming', 'salon', 'spa', 'laundry', 'dry cleaning',
                'courier', 'postal service', 'home services', 'urban company', 'government services', 'passport',
                'driving license', 'pan card', 'aadhaar', 'legal services', 'consulting'
            ]
        }
        
        # Special handling for common transaction types first
        if 'upi-' in description or 'upi/' in description or 'upi:' in description: return 'transfer'
        if 'imps-' in description or 'imps/' in description or 'imps:' in description: return 'transfer'
        if 'neft-' in description or 'neft/' in description or 'neft:' in description: return 'transfer'
        if 'rtgs-' in description or 'rtgs/' in description or 'rtgs:' in description: return 'transfer'
        if 'atm withdrawal' in description or 'atm cash' in description: return 'finance'
        if 'pos ' in description or 'pos/' in description or 'pos-' in description: return 'shopping'
        if 'emi' in description or 'loan' in description: return 'finance'
        if 'salary' in description or 'sal/' in description: return 'income'
        if 'refund' in description: return 'income'
        if 'cashback' in description: return 'income'
        
        # General categorization
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in description:
                    return category
                    
        return 'miscellaneous expenses'

def main():
    """
    Main function to run the parser from the command line for testing.
    This allows for easy debugging of the parsing logic.
    """
    parser = argparse.ArgumentParser(description="Parse a bank statement file (PDF or CSV) into a standardized JSON format.")
    parser.add_argument("file_path", help="The full path to the statement file.")
    
    args = parser.parse_args()

    if not Path(args.file_path).is_file():
        print(f"Error: File not found at {args.file_path}")
        sys.exit(1)

    try:
        # For local testing, we read the file and pass the file object
        with open(args.file_path, 'rb') as f:
            # We need to pass both the file object and the filename
            statement_parser = StatementParser(f, Path(args.file_path).name)
            df = statement_parser.parse()
        
        if not df.empty:
            # Convert DataFrame to JSON
            # Convert datetime to string for JSON compatibility
            df['date'] = df['date'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            output_json = {
                "transactions": df.to_dict('records'),
                "totalSpent": df[df['amount'] < 0]['amount'].sum(),
                "totalReceived": df[df['amount'] > 0]['amount'].sum(),
                "categoryBreakdown": df[df['amount'] < 0].groupby('category')['amount'].sum().to_dict()
            }
            
            # Save to a file or print to console
            output_filename = f"parsed_{Path(args.file_path).stem}.json"
            with open(output_filename, 'w') as f:
                json.dump(output_json, f, indent=4)
            
            print(f"Successfully parsed. Output saved to {output_filename}")
        else:
            print("Parsing resulted in an empty DataFrame. No transactions found or an error occurred.")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 