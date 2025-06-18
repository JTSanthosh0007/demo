from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from parsers.kotak_parser import parse_kotak_statement
from parsers.statement_parser import detect_statement_type, parse_statement

statement_routes = Blueprint('statement_routes', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@statement_routes.route('/analyze-statement', methods=['POST'])
def analyze_statement():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload a PDF file'}), 400

    try:
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(filepath)

        # Detect statement type
        statement_type = detect_statement_type(filepath)
        
        try:
            # Parse based on statement type
            if statement_type == 'kotak':
                result = parse_kotak_statement(filepath)
            else:
                result = parse_statement(filepath, statement_type)

            # Format the response
            response = {
                'transactions': result['transactions'],
                'summary': {
                    'totalReceived': result['summary']['total_credit'],
                    'totalSpent': result['summary']['total_debit'],
                    'balance': result['summary']['net_balance'],
                    'creditCount': result['summary']['credit_count'],
                    'debitCount': result['summary']['debit_count'],
                    'totalTransactions': result['summary']['total_transactions']
                },
                'categoryBreakdown': calculate_category_breakdown(result['transactions']),
                'pageCount': len(result.get('pages', [])) if 'pages' in result else 1,
                'accounts': extract_accounts_info(result)
            }

            # Clean up
            os.remove(filepath)
            
            return jsonify(response)

        except Exception as e:
            # Clean up on error
            os.remove(filepath)
            raise e

    except Exception as e:
        return jsonify({
            'error': 'Failed to analyze statement',
            'details': str(e)
        }), 500

def calculate_category_breakdown(transactions):
    """Calculate spending breakdown by category."""
    categories = {}
    
    for transaction in transactions:
        category = transaction.get('category', 'Others')
        amount = abs(transaction['amount'])
        
        if category not in categories:
            categories[category] = {
                'amount': 0,
                'count': 0,
                'percentage': 0
            }
            
        categories[category]['amount'] += amount
        categories[category]['count'] += 1
    
    # Calculate total amount for percentage calculation
    total_amount = sum(cat['amount'] for cat in categories.values())
    
    # Calculate percentages
    for category in categories.values():
        category['percentage'] = (category['amount'] / total_amount * 100) if total_amount > 0 else 0
    
    return categories

def extract_accounts_info(result):
    """Extract accounts information from the parsing result."""
    accounts = []
    
    if 'account_info' in result:
        account_info = result['account_info']
        accounts.append({
            'accountName': account_info.get('account_name', ''),
            'accountNumber': account_info.get('account_number', ''),
            'bankLogo': 'kotak',  # You can add bank-specific logic here
            'paymentsMade': {
                'count': result['summary']['debit_count'],
                'total': result['summary']['total_debit']
            },
            'paymentsReceived': {
                'count': result['summary']['credit_count'],
                'total': result['summary']['total_credit']
            }
        })
    
    return accounts 