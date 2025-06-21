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
        page_count = 0
        
        try:
            self.file.seek(0)
            
            # Use pdfplumber to get page count first
            with pdfplumber.open(self.file) as pdf:
                page_count = len(pdf.pages)
            
            # Reset file pointer after reading for page count
            self.file.seek(0)
            
            # Heuristic to select the right parser based on filename
            if 'phonepe' in self.filename.lower():
                logger.info("PhonePe statement detected. Using PhonePe-specific parser.")
                df = self._parse_phonepe_pdf()
                return df, page_count

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
                return final_df, page_count
            else:
                logger.error("All parsing methods failed. No transactions could be extracted.")
                return pd.DataFrame(columns=['date', 'amount', 'description', 'category']), page_count
        except Exception as e:
            logger.error(f"A critical error occurred during PDF parsing: {e}", exc_info=True)
            # Return page count even if parsing fails
            return pd.DataFrame(columns=['date', 'amount', 'description', 'category']), page_count

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
                return datetime.now()

            # Remove any extra whitespace and clean up
            date_str = date_str.strip()
            
            # Define multiple formats to try
            formats_to_try = [
                '%d %b %Y',          # 01 Jan 2024
                '%d-%m-%Y',          # 01-01-2024
                '%d/%m/%Y',          # 01/01/2024
                '%b %d, %Y',         # Jan 01, 2024
                '%Y-%m-%d',          # 2024-01-01
                '%d %B %Y',          # 01 January 2024
            ]
            
            for fmt in formats_to_try:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            
            # If all formats fail, log a warning and return a default
            logger.warning(f"Could not parse date string: {date_str}. Using current date as fallback.")
            return datetime.now()
        except Exception as e:
            logger.error(f"An unexpected error occurred in _parse_date for input '{date_str}': {e}")
            return datetime.now()

    def _categorize_transaction(self, description):
        """Categorize transaction based on description keywords."""
        description = description.lower()
        
        # Define keywords for each category
        categories = {
            'Food': ['zomato', 'swiggy', 'restaurant', 'cafe', 'food', 'eat', 'grocery'],
            'Shopping': ['amazon', 'flipkart', 'myntra', 'shopping', 'mart', 'store'],
            'Travel': ['ola', 'uber', 'rapido', 'cab', 'flight', 'irctc', 'redbus', 'travel'],
            'Bills': ['bill', 'recharge', 'electricity', 'water', 'gas', 'broadband', 'postpaid'],
            'Entertainment': ['movie', 'bookmyshow', 'pvr', 'inox', 'netflix', 'spotify'],
            'Health': ['pharmacy', 'hospital', 'apollo', 'medplus', 'clinic'],
            'Transfer': ['transfer', 'upi', 'neft', 'rtgs', 'imps', 'to self', 'from self'],
            'Education': ['school', 'college', 'udemy', 'coursera', 'fee']
        }
        
        for category, keywords in categories.items():
            if any(keyword in description for keyword in keywords):
                return category
        
        return 'Other'

def main():
    """Command-line interface for parsing a statement."""
    
    # Setup argument parser
    parser = argparse.ArgumentParser(description='Parse a bank or UPI statement and output to JSON.')
    parser.add_argument('input_file', help='The path to the PDF statement file.')
    parser.add_argument('-o', '--output_file', default='transactions.json', help='The path to the output JSON file.')
    args = parser.parse_args()

    input_path = Path(args.input_file)
    output_path = Path(args.output_file)
    
    if not input_path.exists():
        print(f"Error: Input file not found at {input_path}")
        sys.exit(1)

    try:
        # Open the file in binary read mode
        with open(input_path, 'rb') as f:
            # Re-wrap in an io.BytesIO buffer for consistency with API
            file_buffer = io.BytesIO(f.read())
            
            # Create a parser instance
            statement_parser = StatementParser(file_buffer, input_path.name)
            
            # Parse the file
            df, page_count = statement_parser.parse()
        
        if df.empty:
            print("No transactions were extracted.")
            sys.exit(0)
            
        # Convert date to string for JSON serialization
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        
        # Save to JSON
        df.to_json(output_path, orient='records', indent=4)
        
        print(f"Successfully parsed {len(df)} transactions and saved to {output_path}")
        print(f"PDF contained {page_count} pages.")
        
    except ValueError as ve:
        print(f"Parsing error: {ve}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main() 
