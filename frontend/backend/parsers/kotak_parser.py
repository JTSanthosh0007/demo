import pandas as pd
import pdfplumber
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple
from functools import lru_cache
import json
import sys
import PyPDF2
from collections import defaultdict
import logging
import fitz  # PyMuPDF
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@lru_cache(maxsize=32)
def parse_kotak_statement(pdf_path: str) -> Dict[str, Any]:
    """
    Parse Kotak Bank statement PDF and extract transaction details.
    Now with caching to prevent re-processing of the same PDF.
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        Dict containing:
        - transactions: List of transaction details
        - summary: Summary of credits, debits, and balance
        - account_info: Account holder details
        - statement_period: Start and end dates
    """
    # Calculate page count first
    page_count = len(PyPDF2.PdfReader(pdf_path).pages)

    print(f"[DEBUG] parse_kotak_statement called with path: {pdf_path}", file=sys.stderr)
    transactions = []
    account_info = {}
    
    print("[DEBUG] Attempting to open PDF with pdfplumber", file=sys.stderr)
    with pdfplumber.open(pdf_path) as pdf:
        print("[DEBUG] Successfully opened PDF with pdfplumber", file=sys.stderr)
        
        # Extract account information from first page only
        first_page = pdf.pages[0]
        text = first_page.extract_text()
        if not text:
            print(json.dumps({"error": "Could not extract text from the PDF. Please ensure this is a valid PDF file."}))
            sys.exit(1)
            
        account_info = extract_account_info(text)
        
        # Process pages in batches for better memory management
        batch_size = 5
        for i in range(0, len(pdf.pages), batch_size):
            batch_pages = pdf.pages[i:i + batch_size]
            for page in batch_pages:
                page_transactions = extract_transactions_from_page(page)
                transactions.extend(page_transactions)
                
    # Sort transactions by date
    if transactions:
         transactions.sort(key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'))
    
    # Calculate summary
    summary = calculate_summary(transactions)
    
    # Get statement period
    statement_period = {
        'start_date': transactions[0]['date'] if transactions else None,
        'end_date': transactions[-1]['date'] if transactions else None
    }
    
    # Categorize transactions
    categorized_transactions = categorize_transactions(transactions)
    
    # Prepare the final result dictionary
    final_result = {
        'transactions': categorized_transactions,
        'summary': summary,
        'account_info': account_info,
        'statement_period': statement_period
    }
    
    final_result['pageCount'] = page_count
    
    final_result['chartData'] = build_chart_data(categorized_transactions)
    
    return final_result

def extract_account_info(text: str) -> Dict[str, str]:
    """Extract account holder information from the statement."""
    info = {}
    
    # Common patterns in Kotak Bank statements
    patterns = {
        'account_number': r'Account\s*Number\s*:\s*(\d+)',
        'account_name': r'Account\s*Name\s*:\s*([^\n]+)',
        'account_type': r'Account\s*Type\s*:\s*([^\n]+)',
        'branch': r'Branch\s*:\s*([^\n]+)'
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            info[key] = match.group(1).strip()
    
    return info

def extract_transactions_from_page(page) -> List[Dict[str, Any]]:
    """Extract transactions from a single page by extracting text and using regex."""
    transactions = []
    
    # Extract text from page
    text = page.extract_text()
    
    if not text:
        print(f"[DEBUG] No text extracted from page {page.page_number}", file=sys.stderr)
        return transactions

    print(f"[DEBUG] Extracted text from page {page.page_number}:\n{text[:500]}...", file=sys.stderr) # Print first 500 chars
    
    # Refined regex pattern based on observed Kotak statement format:
    # Date Narration/Description Chq/Ref No Withdrawal(Dr)/Deposit(Cr) Balance
    # It seems Debit and Credit amounts might be in separate columns or one column with (Dr)/(Cr)
    # Based on the output, it looks like one amount column followed by (Cr) or (Dr) and then balance.
    transaction_pattern = re.compile(
        r'^\s*'  # Optional leading whitespace
        r'(?P<date>\d{2}-\d{2}-\d{4}|\d{2}-\d{2}-\d{2})\s+' # Date (DD-MM-YYYY or DD-MM-YY)
        r'(?P<description>.+?)\s+' # Description (non-greedy)
        # Attempt to capture either a Debit or Credit amount and the Balance
        # This part is tricky and might need further refinement.
        # Let's try to match two potential amount columns followed by (Cr) or (Dr) and then balance
        # Or a single amount column with (Cr) or (Dr) and then balance

        # Pattern for two amount columns (Debit and Credit) and Balance
        # This seems less likely based on the sample, but including as a possibility.
        # r'(?P<debit>-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\-)?\s+'
        # r'(?P<credit>-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\-)?\s+'
        # r'(?P<balance>-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'

        # Pattern for a single amount column followed by (Cr) or (Dr) and then Balance
        # This matches the observed format better.
        r'(?P<amount>-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)' # Amount - Removed trailing backslash
        r'\((?P<type>Cr|Dr)\)\s+' # Transaction type (Cr or Dr) in parentheses
        r'(?P<balance>-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)' # Balance - Removed trailing backslash
    )
    
    # Split text into lines and process each line
    lines = text.splitlines()
    for line in lines:
        # Skip lines that are likely headers or footers
        if 'Date Narration' in line or 'Withdrawal(Dr)/' in line or 'Statement Summary' in line or 'Page' in line or 'End of Statement' in line:
             continue

        print(f"[DEBUG] Processing line for regex: {line}", file=sys.stderr)
        match = transaction_pattern.search(line)
        if match:
            try:
                date_str = match.group('date')
                description = match.group('description').strip()
                amount_str = match.group('amount')
                type_str = match.group('type')
                balance_str = match.group('balance')
                
                # Parse date and amounts using existing functions
                date = parse_date(date_str)
                amount = parse_amount(amount_str)
                balance = parse_amount(balance_str)
                
                # Adjust amount sign based on transaction type
                if type_str == 'Dr':
                    amount = -abs(amount) # Ensure debit amounts are negative
                else:
                    amount = abs(amount) # Ensure credit amounts are positive
                
                transaction = {
                    'date': date,
                    'description': description,
                    'amount': amount,
                    'balance': balance,
                    'type': 'credit' if amount >= 0 else 'debit',
                    'category': 'Others' # Default category, will be updated later
                    # Add other fields if available in regex match
                }
                
                transactions.append(transaction)
                print(f"[DEBUG] Found transaction: {transaction}", file=sys.stderr)
                
            except Exception as e:
                print(f"[ERROR] Error parsing matched transaction line \'{line}': {e}", file=sys.stderr)

    print(f"[DEBUG] Finished processing page {page.page_number}. Found {len(transactions)} transactions.", file=sys.stderr)
    
    return transactions

def parse_date(date_str: str) -> str:
    """Parse date string to YYYY-MM-DD format."""
    try:
        # Handle common date formats in Kotak statements
        for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y']:
            try:
                return datetime.strptime(date_str.strip(), fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        raise ValueError(f"Unable to parse date: {date_str}")
    except Exception:
        raise ValueError(f"Invalid date format: {date_str}")

def parse_amount(amount_str: str) -> float:
    """Parse amount string to float."""
    if not amount_str or amount_str.strip() == '-':
        return 0.0
    
    # Remove currency symbols, commas and convert to float
    amount_str = re.sub(r'[₹,]', '', amount_str.strip())
    try:
        return float(amount_str)
    except ValueError:
        return 0.0

def calculate_summary(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate summary of transactions."""
    total_credit = sum(t['amount'] for t in transactions if t['amount'] > 0)
    total_debit = sum(t['amount'] for t in transactions if t['amount'] < 0)
    
    credit_count = sum(1 for t in transactions if t['amount'] > 0)
    debit_count = sum(1 for t in transactions if t['amount'] < 0)
    
    return {
        'total_credit': total_credit,
        'total_debit': abs(total_debit),
        'net_balance': total_credit + total_debit,
        'credit_count': credit_count,
        'debit_count': debit_count,
        'total_transactions': len(transactions)
    }

def categorize_transactions(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Categorize transactions based on description."""
    # Updated categories based on user's provided list
    categories = {
        'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'food', 'dining', 'cafe', 'hotel', 'milk', 'tea', 'coffee'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'retail', 'mart', 'shop', 'store', 'market', 'purchase'],
        'Transport': ['uber', 'ola', 'petrol', 'fuel', 'metro', 'bus', 'train', 'transport', 'auto', 'taxi'],
        'Bills & Utilities': ['airtel', 'jio', 'vodafone', 'electricity', 'water', 'gas', 'bill', 'dth', 'broadband'],
        'Recharge': ['recharge', 'mobile recharge', 'phone recharge'],
        'Entertainment': ['netflix', 'amazon prime', 'hotstar', 'movie', 'game', 'spotify', 'entertainment'],
        'Health': ['medical', 'hospital', 'pharmacy', 'doctor', 'clinic', 'medicine', 'health'],
        'Education': ['school', 'college', 'university', 'course', 'training', 'tuition', 'education'],
        'Transfer': ['transfer', 'sent', 'received', 'upi', 'neft', 'imps', 'payment'],
        'Finance': ['emi', 'loan', 'insurance', 'investment', 'mutual fund', 'finance', 'bank']
    }
    
    # Ensure a default 'Others' category exists if no keywords match
    default_category = 'Others'
    
    categorized_transactions = []
    for transaction in transactions:
        description = transaction['description'].lower() # Convert description to lowercase for case-insensitive matching
        
        # Find matching category
        found_category = default_category
        for category, keywords in categories.items():
            if any(keyword in description for keyword in keywords):
                found_category = category
                break
                
        transaction['category'] = found_category
        
        print(f"[DEBUG] Categorized transaction: Description='{transaction['description']}', Category='{transaction['category']}'", file=sys.stderr) # Added logging
                
        # The transaction type (UPI, NEFT, etc.) is already being extracted by the regex
        # in extract_transactions_from_page and included in the description.
        # The original logic to add 'transaction_type' separately is redundant now.
        # If specific extraction of transaction type is still needed, the regex in
        # extract_transactions_from_page should be updated to capture it explicitly.
        
        categorized_transactions.append(transaction) # Append to new list
        
    return categorized_transactions # Return the new list

def build_chart_data(transactions):
    # Group by category and sum amounts
    category_totals = defaultdict(float)
    for txn in transactions:
        category_totals[txn['category']] += abs(txn['amount'])

    labels = list(category_totals.keys())
    data = [category_totals[label] for label in labels]
    backgroundColor = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
    ]

    return {
        'data': {
            'labels': labels,
            'datasets': [{
                'data': data,
                'backgroundColor': backgroundColor[:len(labels)]
            }]
        }
    }

class KotakParser:
    def __init__(self, file_obj):
        self.file_obj = file_obj
        
    def parse(self):
        """Parse Kotak bank statement PDF with enhanced accuracy"""
        try:
            pdf_stream = io.BytesIO(self.file_obj.read())
            doc = fitz.open(stream=pdf_stream, filetype="pdf")
            all_text = []
            
            # Extract text with better layout preservation
            for page_num in range(len(doc)):
                page = doc[page_num]
                # Use "text" mode with preserved layout
                text = page.get_text("text")
                all_text.append(text)
            
            full_text = "\n".join(all_text)
            
            # Pre-process text to handle Kotak's specific formatting
            full_text = self._preprocess_text(full_text)
            
            # Extract transactions with Kotak-specific patterns
            transactions = self._extract_transactions(full_text)
            
            if transactions:
                df = pd.DataFrame(transactions)
                df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
                df = df[df['amount'].abs() > 0]
                df = df.drop_duplicates(subset=['date', 'amount', 'description'])
                df = df.sort_values('date')
                df['date'] = pd.to_datetime(df['date'])
                
                # Post-process to improve categorization
                df['category'] = df.apply(lambda row: self._post_process_category(row), axis=1)
                
                logger.info(f"Successfully extracted {len(df)} transactions from Kotak statement")
                return df
            else:
                logger.error("No transactions extracted from Kotak statement")
                return pd.DataFrame(columns=['date', 'amount', 'description', 'category'])
                
        except Exception as e:
            logger.error(f"Error parsing Kotak PDF: {str(e)}")
            raise
        finally:
            if 'doc' in locals():
                doc.close()
    
    def _preprocess_text(self, text):
        """Pre-process text to handle Kotak's formatting quirks"""
        # Remove header and footer noise
        text = re.sub(r'Page \d+ of \d+', '', text)
        text = re.sub(r'Statement Period:.*', '', text)
        
        # Fix common OCR issues in Kotak statements
        text = text.replace('Dr.', 'Dr')
        text = text.replace('Cr.', 'Cr')
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Ensure transaction lines are properly separated
        text = re.sub(r'(\d{2}-\d{2}-\d{4})', r'\n\1', text)
        
        return text
                
    def _extract_transactions(self, text):
        """Extract transactions with Kotak-specific patterns"""
        transactions = []
        
        # Multiple patterns to catch different Kotak statement formats
        patterns = [
            # Standard format with explicit columns
            re.compile(
                r'(\d{2}-\d{2}-\d{4})\s+'  # Date
                r'([^0-9]+?)\s+'  # Description (non-greedy, no numbers)
                r'(?:[A-Z0-9]+\s+)?'  # Optional reference number
                r'([\d,]+\.\d{2})?\s+'  # Optional withdrawal amount
                r'([\d,]+\.\d{2})?\s+'  # Optional deposit amount
                r'([\d,]+\.\d{2})',  # Balance
                re.MULTILINE
            ),
            
            # Format with Dr/Cr indicators
            re.compile(
                r'(\d{2}-\d{2}-\d{4})\s+'  # Date
                r'([^(]+?)\s+'  # Description
                r'([\d,]+\.\d{2})\s*\((\w{2})\)',  # Amount with Dr/Cr
                re.MULTILINE
            ),
            
            # UPI/IMPS specific format
            re.compile(
                r'(\d{2}-\d{2}-\d{4})\s+'  # Date
                r'((?:UPI|IMPS|NEFT|ATM|POS)[^0-9]*?)'  # UPI/IMPS description
                r'(?:.*?)'  # Any text in between
                r'([\d,]+\.\d{2})\s*\((\w{2})\)',  # Amount with Dr/Cr
                re.MULTILINE
            )
        ]
        
        for pattern in patterns:
            matches = pattern.finditer(text)
            for match in matches:
                try:
                    if len(match.groups()) >= 5:  # First pattern
                        date_str = match.group(1)
                        description = match.group(2).strip()
                        withdrawal = match.group(3)
                        deposit = match.group(4)
                        
                        if withdrawal and withdrawal.strip():
                            amount = -float(withdrawal.replace(',', ''))
                        elif deposit and deposit.strip():
                            amount = float(deposit.replace(',', ''))
                        else:
                            continue
                            
                    elif len(match.groups()) >= 4:  # Second or third pattern
                        date_str = match.group(1)
                        description = match.group(2).strip()
                        amount_str = match.group(3).replace(',', '')
                        txn_type = match.group(4).upper()
                        
                        amount = float(amount_str)
                        if txn_type == 'DR':
                            amount = -amount
                    else:
                        continue
                    
                    # Clean up description
                    description = self._clean_description(description)
                    date = self._parse_date(date_str)
                    
                    # Add transaction with enhanced categorization
                    transactions.append({
                        'date': date,
                        'amount': amount,
                        'description': description,
                        'category': self._categorize_transaction(description, amount)
                    })
                except Exception as e:
                    logger.warning(f"Could not process Kotak transaction: {e}")
        
        return transactions
    
    def _clean_description(self, description):
        """Clean up transaction descriptions"""
        if not description:
            return "Unknown transaction"
            
        # Remove extra spaces
        description = re.sub(r'\s+', ' ', description).strip()
        
        # Remove common noise in Kotak descriptions
        noise_patterns = [
            r'TRANSACTION ID:.*',
            r'REF NO:.*',
            r'REFERENCE:.*',
            r'REMARKS:.*'
        ]
        
        for pattern in noise_patterns:
            description = re.sub(pattern, '', description)
            
        # Truncate very long descriptions
        if len(description) > 100:
            description = description[:97] + '...'
            
        return description.strip()
    
    def _parse_date(self, date_str):
        """Parse Kotak date formats"""
        try:
            # Try common Kotak date formats
            for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%d.%m.%Y']:
                try:
                    return datetime.strptime(date_str, fmt)
                except:
                    continue
                    
            # If all formats fail, log and return today
            logger.warning(f"Could not parse date: {date_str}")
            return datetime.now()
        except:
            return datetime.now()
    
    def _categorize_transaction(self, description, amount):
        """Kotak-specific transaction categorization"""
        try:
            if not description:
                return 'miscellaneous expenses'
                
            description = description.lower()
            
            # Kotak-specific patterns
            if 'salary' in description or 'sal cr' in description:
                return 'income'
                
            if any(x in description for x in ['upi-', 'upi/', 'upi ', 'imps-', 'imps/', 'neft-', 'neft/']):
                # Further analyze UPI transactions
                if any(x in description for x in ['swiggy', 'zomato', 'food']):
                    return 'food'
                if any(x in description for x in ['uber', 'ola', 'rapido']):
                    return 'travel'
                if any(x in description for x in ['amazon', 'flipkart', 'myntra']):
                    return 'shopping'
                return 'transfer'
                
            if 'atm' in description or 'cash withdrawal' in description:
                return 'transfer'
                
            if 'pos ' in description or 'pos/' in description:
                # POS is usually shopping
                return 'shopping'
                
            if 'emi' in description or 'loan' in description:
                return 'finance'
                
            # Standard categories
            categories = {
                'food': ['restaurant', 'food', 'swiggy', 'zomato', 'dining', 'cafe', 'hotel'],
                'shopping': ['amazon', 'flipkart', 'myntra', 'retail', 'store', 'shop', 'mall'],
                'travel': ['uber', 'ola', 'metro', 'petrol', 'fuel', 'travel', 'irctc', 'railway'],
                'bills': ['electricity', 'water', 'gas', 'mobile', 'phone', 'internet', 'dth', 'recharge'],
                'entertainment': ['movie', 'netflix', 'prime', 'hotstar', 'subscription'],
                'finance': ['emi', 'loan', 'interest', 'insurance', 'premium', 'investment'],
                'health': ['hospital', 'doctor', 'medical', 'pharmacy', 'medicine'],
                'education': ['school', 'college', 'tuition', 'course', 'fee'],
                'income': ['salary', 'interest earned', 'dividend', 'refund', 'cashback'],
                'transfer': ['transfer', 'sent', 'received', 'payment', 'deposit', 'withdraw']
            }
            
            for category, keywords in categories.items():
                if any(keyword in description for keyword in keywords):
                    return category
                    
            # Amount-based categorization as fallback
            if amount > 10000:  # Large credits often income
                if amount > 0:
                    return 'income'
                else:
                    return 'finance'  # Large debits often major expenses
                    
            return 'miscellaneous expenses'
            
        except Exception as e:
            logger.error(f"Error categorizing transaction: {str(e)}")
            return 'miscellaneous expenses'
    
    def _post_process_category(self, row):
        """Post-process categories based on transaction patterns"""
        # Re-categorize based on combined description and amount patterns
        description = row['description'].lower() if isinstance(row['description'], str) else ''
        amount = row['amount']
        category = row['category']
        
        # Monthly patterns
        recurring_bill_amounts = [199, 299, 399, 499, 999]
        recurring_amounts_tolerance = 5  # Allow small variations
        
        # Check for streaming services by amount
        if any(abs(abs(amount) - bill) < recurring_amounts_tolerance for bill in recurring_bill_amounts):
            if 'entertainment' not in category:
                if any(x in description for x in ['subscription', 'monthly', 'renewal']):
                    return 'entertainment'
        
        # Salary typically comes at month end and is a large credit
        if amount > 10000 and amount > 0:
            day = row['date'].day
            if day >= 25 or day <= 7:  # End or beginning of month
                if 'salary' not in category:
                    return 'income'
        
        # Keep original category if no post-processing applied
        return category

# Add a top-level try...except block to catch any error
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("[ERROR] Usage: python kotak_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    
    try:
        results = parse_kotak_statement(pdf_path)
        print(json.dumps(results))
    except Exception as e:
        print(f"[ERROR] An unexpected error occurred: {str(e)}", file=sys.stderr)
        sys.exit(1) 