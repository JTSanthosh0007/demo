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
        """Dedicated parser for PhonePe statements with a robust regex."""
        transactions = []
        # A robust regex to capture the main transaction line from the logs
        phonepe_pattern = re.compile(
            r"(?P<date>\w{3} \d{1,2}, \d{4})\s+"  # e.g., Feb 27, 2025
            r"(?P<description>.*?)\s+"             # Description (non-greedy)
            r"(?P<type>DEBIT|CREDIT)\s+"          # Transaction type
            r"₹(?P<amount>[\d,]+)",               # Amount e.g., 40 or 1,500
            re.MULTILINE
        )

        try:
            self.file.seek(0) # Reset file pointer
            with pdfplumber.open(self.file) as pdf:
                full_text = "".join(page.extract_text() or "" for page in pdf.pages)
                
                # Logging for debugging
                logger.info("--- Extracted PhonePe PDF Text (for new regex) ---")
                logger.info(full_text)
                logger.info("------------------------------------")

            matches = phonepe_pattern.finditer(full_text)
            for match in matches:
                try:
                    data = match.groupdict()
                    description = data['description'].strip()
                    amount_str = data['amount'].replace(',', '')
                    amount = float(amount_str)
                    
                    # Use the 'type' to determine sign of amount
                    if data['type'] == 'DEBIT':
                        amount = -abs(amount)
                    else:
                        amount = abs(amount)
                    
                    # Date format is like "Feb 27, 2025"
                    date = datetime.strptime(data['date'], '%b %d, %Y')

                    transactions.append({
                        'date': date,
                        'amount': amount,
                        'description': description,
                        'category': self._categorize_transaction(description)
                    })
                except Exception as e:
                    logger.warning(f"Could not process a PhonePe transaction match: {match.groups()}. Error: {e}")

        except Exception as e:
            logger.error(f"Error during PhonePe parsing: {e}", exc_info=True)
            return pd.DataFrame()

        if not transactions:
            logger.warning("No transactions found using the new PhonePe regex pattern.")
            return pd.DataFrame()

        logger.info(f"Successfully parsed {len(transactions)} transactions from PhonePe statement.")
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
            'food': [
                'barbeque nation', 'burger king', 'cafe coffee day', 'ccd', 'dominos', 'haldiram', 
                'kfc', 'mcdonalds', 'pizza hut', 'subway', 'swiggy', 'zomato', 'food'
            ],
            'shopping': [
                'reliance retail', 'dmart', 'big bazaar', 'flipkart', 'amazon', 'snapdeal', 'myntra', 
                'ajio', 'nykaa', 'shopping'
            ],
            'travel': [
                'uber', 'ola', 'rapido', 'irctc', 'redbus', 'makemytrip', 'goibibo', 'travel'
            ],
            'bills': [
                'electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'recharge', 'bill'
            ],
            'entertainment': [
                'movie', 'cinema', 'pvr', 'inox', 'netflix', 'prime', 'hotstar', 'bookmyshow'
            ],
            'finance': [
                'emi', 'loan', 'interest', 'insurance', 'premium', 'lic', 'mutual fund', 'sip', 
                'investment', 'deposit', 'credit card', 'debit card', 'bank charges'
            ],
            'health': [
                'hospital', 'doctor', 'clinic', 'medical', 'medicine', 'pharmacy', 'apollo'
            ],
            'education': [
                'school', 'college', 'university', 'institute', 'course', 'training', 'fees'
            ],
            'transfer': [
                'transfer', 'sent', 'received', 'payment', 'upi', 'neft', 'rtgs', 'imps',
                'paytm', 'phonepe', 'gpay', 'google pay', 'amazon pay'
            ],
            'income': [
                'salary', 'refund', 'cashback', 'credit', 'interest received'
            ]
        }
        
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in description:
                    return category
                    
        return 'miscellaneous expenses'

def main():
    """
    Main function to run the parser from the command line for testing.
    """
    parser = argparse.ArgumentParser(description="Parse a bank statement file.")
    parser.add_argument("file_path", help="The full path to the statement file.")
    
    args = parser.parse_args()

    if not Path(args.file_path).is_file():
        print(f"Error: File not found at {args.file_path}")
        sys.exit(1)

    try:
        with open(args.file_path, 'rb') as f:
            statement_parser = StatementParser(f, Path(args.file_path).name)
            df = statement_parser.parse()
        
        if not df.empty:
            df['date'] = df['date'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            output_json = {
                "transactions": df.to_dict('records'),
                "totalSpent": df[df['amount'] < 0]['amount'].sum(),
                "totalReceived": df[df['amount'] > 0]['amount'].sum(),
                "categoryBreakdown": df[df['amount'] < 0].groupby('category')['amount'].sum().to_dict()
            }
            
            output_filename = f"parsed_{Path(args.file_path).stem}.json"
            with open(output_filename, 'w') as f:
                json.dump(output_json, f, indent=4)
            
            print(f"Successfully parsed. Output saved to {output_filename}")
        else:
            print("Parsing resulted in an empty DataFrame.")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 