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
    def __init__(self, file_path):
        self.file_path = file_path
        self.filename = Path(file_path).name

    def parse(self):
        """Parse the file into a standardized DataFrame"""
        if self.filename.endswith('.pdf'):
            return self._parse_pdf()
        else:
            raise ValueError("Unsupported file format")

    def _parse_pdf(self):
        """
        Robustly parse tables from a PDF to extract transaction data.
        This method avoids fragile regex in favor of table structure analysis.
        """
        logger.info(f"Starting PDF parsing for {self.filename}")
        transactions = []
        try:
            with pdfplumber.open(self.file_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    logger.info(f"Processing page {i + 1}/{len(pdf.pages)}")
                    
                    # Extract tables from the page
                    tables = page.extract_tables()
                    logger.info(f"Found {len(tables)} tables on page {i + 1}")

                    for table_num, table in enumerate(tables):
                        if not table:
                            logger.warning(f"Skipping empty table {table_num + 1} on page {i + 1}")
                            continue

                        # Convert to DataFrame to easily find header and data
                        df = pd.DataFrame(table)
                        
                        # Find the header row by looking for keywords
                        header_keywords = ['date', 'transaction', 'narration', 'description', 'details', 'chq', 'ref', 'withdrawal', 'deposit', 'amount', 'balance']
                        header_row_index = -1
                        for row_idx, row in df.iterrows():
                            row_str = ' '.join(map(str, row.values)).lower()
                            if any(keyword in row_str for keyword in header_keywords):
                                header_row_index = row_idx
                                break
                        
                        if header_row_index == -1:
                            logger.warning(f"No transaction header found in table {table_num + 1} on page {i + 1}. Skipping table.")
                            continue
                            
                        # Set the header and clean up the DataFrame
                        header = [str(h).lower().strip() for h in df.iloc[header_row_index]]
                        df.columns = header
                        data_df = df.iloc[header_row_index + 1:].reset_index(drop=True)

                        # Identify columns for date, description, withdrawal, and deposit
                        date_col = next((c for c in header if 'date' in c), None)
                        desc_col = next((c for c in header if any(k in c for k in ['narration', 'description', 'transaction details'])), None)
                        withdrawal_col = next((c for c in header if any(k in c for k in ['withdrawal', 'debit', 'dr.'])), None)
                        deposit_col = next((c for c in header if any(k in c for k in ['deposit', 'credit', 'cr.'])), None)

                        if not all([date_col, desc_col, withdrawal_col, deposit_col]):
                            logger.warning(f"Could not identify all required columns in table {table_num + 1} on page {i + 1}. Skipping.")
                            continue

                        logger.info(f"Successfully identified transaction columns in table {table_num + 1} on page {i + 1}")

                        # Process each transaction row
                        for _, row in data_df.iterrows():
                            try:
                                date = self._parse_date(row[date_col])
                                description = row[desc_col]
                                
                                # Withdrawal amount (debit)
                                withdrawal_str = str(row[withdrawal_col] or '0').replace(',', '').strip()
                                # Deposit amount (credit)
                                deposit_str = str(row[deposit_col] or '0').replace(',', '').strip()

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
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Skipping row due to parsing error: {row}. Error: {e}")
                                continue
            
            if transactions:
                final_df = pd.DataFrame(transactions)
                # Remove rows where description might be a header fragment
                final_df = final_df[~final_df['description'].str.contains('balance', case=False)]
                final_df = final_df.drop_duplicates().sort_values('date').reset_index(drop=True)
                logger.info(f"Successfully parsed {len(final_df)} transactions.")
                return final_df
            else:
                logger.warning("No transactions could be extracted from any table in the PDF.")
                return pd.DataFrame(columns=['date', 'amount', 'description', 'category'])

        except Exception as e:
            logger.error(f"A critical error occurred during PDF parsing: {e}", exc_info=True)
            return pd.DataFrame(columns=['date', 'amount', 'description', 'category'])

    def _parse_date(self, date_str):
        """Parse date string into datetime object"""
        try:
            if not date_str:
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
                    if parsed_date.year > datetime.now().year:
                        parsed_date = parsed_date.replace(year=datetime.now().year)
                    return parsed_date
                except ValueError:
                    continue
            
            # Fallback: try to extract components
            components = re.findall(r'\d+', date_str)
            if len(components) >= 3:
                day, month, year = map(int, components[:3])
                if year < 100:
                    year += 2000 if year < 50 else 1900
                return datetime(year, month, day)
            
            return datetime.now()
            
        except Exception as e:
            logger.error(f"Date parsing error: {str(e)}")
            return datetime.now()

    def _categorize_transaction(self, description):
        """Enhanced transaction categorization with comprehensive India-specific terms"""
        description = description.lower()
        
        categories = {
            # Food & Dining - Indian Restaurants & Food Services
            'food': [
                # Popular Restaurant Chains
                'barbeque nation', 'burger king', 'cafe coffee day', 'ccd', 'dominos', 'haldiram', 
                'kfc', 'mcdonalds', 'pizza hut', 'subway', 'wow momo', 'biryani blues', 'biryani by kilo',
                'behrouz biryani', 'faasos', 'oven story', 'paradise biryani', 'punjab grill', 'mainland china',
                
                # Regional Food Terms
                'thali', 'dosa', 'idli', 'vada', 'sambar', 'chutney', 'paratha', 'naan', 'roti', 'chapati',
                'dal', 'paneer', 'chole', 'rajma', 'kadhi', 'sabzi', 'bhaji', 'pav', 'vada pav', 'pav bhaji',
                'misal pav', 'poha', 'upma', 'uttapam', 'appam', 'puttu', 'biryani', 'pulao', 'tandoori',
                'kebab', 'tikka', 'kathi roll', 'frankie', 'pani puri', 'golgappa', 'bhel puri', 'sev puri',
                'chaat', 'samosa', 'kachori', 'pakora', 'bhajiya', 'dhokla', 'khaman', 'thepla', 'khichdi',
                'undhiyu', 'rasam', 'sambhar', 'avial', 'porotta', 'malabar parotta', 'kothu parotta',
                
                # Food Delivery & Services
                'swiggy', 'zomato', 'uber eats', 'foodpanda', 'box8', 'freshmenu', 'eatfit', 'tinyowl',
                'holachef', 'inner chef', 'yumist', 'dailyninja', 'milkbasket', 'supr daily', 'doodhwala',
                'licious', 'freshtohome', 'meatigo', 'zappfresh', 'easyday', 'bigbasket', 'grofers', 'jiomart',
                
                # Sweet Shops & Desserts
                'haldiram', 'bikanervala', 'aggarwal sweets', 'ganguram', 'kc das', 'mithai', 'sweet',
                'rasgulla', 'gulab jamun', 'jalebi', 'imarti', 'ladoo', 'barfi', 'peda', 'kalakand',
                'mysore pak', 'kaju katli', 'soan papdi', 'petha', 'ghevar', 'malpua', 'rabri', 'kheer',
                'payasam', 'basundi', 'kulfi', 'falooda', 'lassi', 'shrikhand', 'mishti doi', 'rasmalai'
            ],
            
            # Shopping - Indian Retail & E-commerce
            'shopping': [
                # Major Indian Retailers
                'reliance retail', 'dmart', 'big bazaar', 'future retail', 'v-mart', 'pantaloons', 'shoppers stop',
                'lifestyle', 'westside', 'central', 'brand factory', 'max', 'trends', 'reliance digital',
                'croma', 'vijay sales', 'pai international', 'girias', 'viveks', 'nilgiris', 'spencer',
                'more retail', 'nature\'s basket', 'foodhall', 'metro cash & carry', 'vishal mega mart',
                
                # E-commerce Platforms
                'flipkart', 'amazon', 'snapdeal', 'myntra', 'ajio', 'nykaa', 'tata cliq', 'meesho', 'limeroad',
                'pepperfry', 'urban ladder', 'firstcry', 'hopscotch', 'bigbasket', 'grofers', 'jiomart',
                'pharmeasy', 'netmeds', '1mg', 'medlife', 'lenskart', 'caratlane', 'bluestone', 'pepperfry',
                
                # Local Market Terms
                'kirana', 'general store', 'provision store', 'departmental store', 'supermarket', 'hypermarket',
                'mall', 'shopping center', 'emporium', 'bazaar', 'haat', 'mandi', 'wholesale', 'retail',
                'sadar bazaar', 'chandni chowk', 'crawford market', 'commercial street', 'mg road', 't nagar',
                
                # Product Categories
                'electronics', 'mobile', 'laptop', 'tv', 'refrigerator', 'washing machine', 'ac', 'furniture',
                'home decor', 'kitchenware', 'appliances', 'clothing', 'footwear', 'accessories', 'jewelry',
                'books', 'stationery', 'toys', 'sports', 'fitness', 'beauty', 'personal care', 'baby products'
            ],
            
            # Travel & Transport - Indian Services
            'travel': [
                # Airlines
                'indigo', 'air india', 'spicejet', 'go air', 'vistara', 'air asia', 'akasa air',
                'alliance air', 'star air', 'flyeasy', 'truejet', 'air india express', 'jet airways',
                
                # Railways
                'irctc', 'indian railways', 'railway', 'train', 'rajdhani', 'shatabdi', 'duronto',
                'garib rath', 'jan shatabdi', 'sampark kranti', 'humsafar', 'tejas', 'vande bharat',
                'passenger train', 'express train', 'local train', 'metro rail', 'suburban train',
                
                # Bus Services
                'apsrtc', 'tsrtc', 'ksrtc', 'bmtc', 'best', 'msrtc', 'gsrtc', 'rsrtc', 'upsrtc',
                'hrtc', 'prtc', 'punbus', 'tnstc', 'setc', 'kerala rtc', 'jksrtc', 'osrtc', 'wbtc',
                'redbus', 'abhibus', 'paytm bus', 'makemytrip bus', 'goibibo bus', 'yatra bus',
                
                # Cab & Auto Services
                'ola', 'uber', 'meru', 'savaari', 'rapido', 'jugnoo', 'fasttrack', 'mega cabs',
                'easy cabs', 'tab cab', 'auto', 'rickshaw', 'taxi', 'cab', 'bike taxi', 'shuttle',
                
                # Travel Booking Platforms
                'makemytrip', 'goibibo', 'cleartrip', 'yatra', 'easemytrip', 'ixigo', 'paytm travel',
                'via', 'akbar travels', 'sotc', 'thomas cook', 'cox & kings', 'kesari tours', 'veena world',
                
                # Hotels & Accommodation
                'oyo', 'fabhotels', 'treebo', 'lemon tree', 'taj', 'oberoi', 'itc', 'leela', 'marriott',
                'hyatt', 'radisson', 'novotel', 'ibis', 'ginger', 'fortune', 'sarovar', 'royal orchid',
                
                # Fuel & Vehicle Services
                'indian oil', 'iocl', 'bharat petroleum', 'bpcl', 'hindustan petroleum', 'hpcl',
                'reliance petroleum', 'essar oil', 'shell', 'petrol', 'diesel', 'cng', 'lpg', 'ev charging',
                'fastag', 'netc fastag', 'paytm fastag', 'sbi fastag', 'icici fastag', 'hdfc fastag',
                'axis fastag', 'airtel fastag', 'indusind fastag', 'kotak fastag', 'idfc fastag'
            ],
            
            # Bills & Utilities - Indian Providers
            'bills': [
                # Electricity Providers
                'adani electricity', 'tata power', 'reliance energy', 'bses', 'bses rajdhani', 'bses yamuna',
                'msedcl', 'mahadiscom', 'bescom', 'hescom', 'gescom', 'mescom', 'cescom', 'kseb', 'tneb',
                'tangedco', 'apspdcl', 'apcpdcl', 'tsspdcl', 'tgnpdcl', 'wbsedcl', 'cesc', 'jvvnl',
                'avvnl', 'jdvvnl', 'pspcl', 'uhbvn', 'dhbvn', 'uppcl', 'mvvnl', 'pvvnl', 'dvvnl', 'kesco',
                
                # Telecom Providers
                'airtel', 'jio', 'vodafone idea', 'vi', 'bsnl', 'mtnl', 'tata tele', 'airtel broadband',
                'jio fiber', 'act fibernet', 'hathway', 'den', 'siti', 'tata sky broadband', 'excitel',
                'spectra', 'tikona', 'you broadband', 'nextra broadband', 'asianet', 'bsnl broadband',
                
                # DTH & Cable Services
                'tata play', 'tata sky', 'dish tv', 'd2h', 'sun direct', 'airtel digital tv', 'dd free dish',
                'den cable', 'hathway cable', 'siti cable', 'in cable', 'asianet digital', 'kerala vision',
                
                # Gas Providers
                'indane', 'hp gas', 'bharatgas', 'mahanagar gas', 'igl', 'mgl', 'gail gas', 'adani gas',
                'gujarat gas', 'sabarmati gas', 'tripura natural gas', 'assam gas', 'central up gas',
                
                # Water Boards
                'delhi jal board', 'mcgm water', 'bwssb', 'hmwssb', 'cmwssb', 'kwa', 'watco', 'phed',
                'municipal water', 'corporation water', 'water board', 'water supply',
                
                # Bill Payment Platforms
                'bharat billpay', 'bbps', 'paytm bills', 'phonepe bills', 'amazon pay bills', 'google pay bills',
                'freecharge bills', 'mobikwik bills', 'cred bills', 'airtel payments bank bills'
            ],
            
            # Banking & Finance - Indian Institutions
            'finance': [
                # Banks
                'sbi', 'state bank', 'pnb', 'punjab national', 'bank of baroda', 'bob', 'bank of india',
                'union bank', 'canara bank', 'indian bank', 'central bank', 'indian overseas', 'uco bank',
                'bank of maharashtra', 'punjab & sind', 'hdfc bank', 'icici bank', 'axis bank', 'kotak',
                'idfc first', 'yes bank', 'indusind', 'rbl', 'federal bank', 'south indian bank', 'karnataka bank',
                'city union bank', 'dcb bank', 'dhanlaxmi bank', 'jammu & kashmir bank', 'bandhan bank',
                'idbi bank', 'citi bank', 'hsbc', 'standard chartered', 'deutsche bank', 'dbs', 'barclays',
                
                # Payment Banks & Small Finance Banks
                'airtel payments bank', 'paytm payments bank', 'india post payments bank', 'fino payments bank',
                'jio payments bank', 'nsdl payments bank', 'au small finance', 'equitas small finance',
                'ujjivan small finance', 'jana small finance', 'capital small finance', 'utkarsh small finance',
                'north east small finance', 'fincare small finance', 'esaf small finance', 'suryoday small finance',
                
                # Insurance Companies
                'lic', 'sbi life', 'hdfc life', 'icici prudential', 'max life', 'bajaj allianz life',
                'aditya birla sun life', 'tata aia', 'exide life', 'pnb metlife', 'kotak life', 'canara hsbc',
                'new india assurance', 'united india', 'oriental insurance', 'national insurance', 'iffco tokio',
                'icici lombard', 'hdfc ergo', 'bajaj allianz general', 'tata aig', 'star health', 'care health',
                'manipal cigna', 'aditya birla health', 'max bupa', 'niva bupa', 'reliance general', 'sbi general',
                
                # Mutual Funds & Investments
                'sbi mutual fund', 'hdfc mutual fund', 'icici prudential mutual fund', 'aditya birla sun life mutual fund',
                'nippon india mutual fund', 'kotak mutual fund', 'axis mutual fund', 'uti mutual fund',
                'dsp mutual fund', 'idfc mutual fund', 'invesco mutual fund', 'franklin templeton',
                'zerodha', 'groww', 'upstox', 'angel broking', 'iifl securities', 'motilal oswal', 'sharekhan',
                'icici direct', 'hdfc securities', 'kotak securities', 'sbi securities', 'geojit', '5paisa',
                
                # Loan Providers
                'bajaj finserv', 'bajaj finance', 'hdfc ltd', 'lic housing finance', 'indiabulls housing',
                'pnb housing', 'tata capital', 'aditya birla finance', 'icici home finance', 'l&t finance',
                'manappuram finance', 'muthoot finance', 'shriram finance', 'cholamandalam investment',
                'mahindra finance', 'home credit', 'fullerton india', 'iifl finance', 'dhani', 'paysense',
                'moneyview', 'kreditbee', 'cashe', 'earlysalary', 'lendingkart', 'flexiloans', 'zestmoney'
            ],
            
            # Health & Medical - Indian Healthcare
            'health': [
                # Hospital Chains
                'apollo hospitals', 'fortis healthcare', 'max healthcare', 'manipal hospitals', 'narayana health',
                'medanta', 'kokilaben hospital', 'lilavati hospital', 'jaslok hospital', 'hinduja hospital',
                'aiims', 'kims', 'care hospitals', 'rainbow hospitals', 'yashoda hospitals', 'star hospitals',
                'columbia asia', 'cloudnine', 'motherhood', 'artemis', 'bgs gleneagles', 'cmri', 'ruby hall',
                'wockhardt', 'breach candy', 'aster', 'sims', 'srm', 'cmc vellore', 'st johns', 'ms ramaiah',
                
                # Pharmacy Chains
                'apollo pharmacy', 'medplus', 'netmeds', '1mg', 'pharmeasy', 'wellness forever', 'medlife',
                'frank ross', 'guardian pharmacy', 'truworth', 'planet health', 'dawaa dost', 'generico',
                'zeno health', 'lifecare', 'apollo 24|7', 'tata 1mg', 'healthkart', 'pharmarack', 'myra',
                
                # Diagnostic Centers
                'dr lal pathlabs', 'metropolis', 'thyrocare', 'suburban diagnostics', 'srg diagnostics',
                'vijaya diagnostic', 'medall', 'suraksha diagnostic', 'max lab', 'apollo diagnostics',
                'pathkind labs', 'neuberg diagnostics', 'mahajan imaging', 'anand diagnostic', 'aarthi scans',
                
                # Health Insurance
                'star health', 'care health', 'max bupa', 'niva bupa', 'aditya birla health', 'manipal cigna',
                'hdfc ergo health', 'icici lombard health', 'sbi health', 'tata aig health', 'bajaj allianz health',
                'new india health', 'oriental health', 'national health', 'united india health', 'mediclaim',
                
                # Ayurveda & Alternative Medicine
                'patanjali', 'himalaya', 'dabur', 'baidyanath', 'zandu', 'organic india', 'kerala ayurveda',
                'kottakkal arya vaidya sala', 'jiva ayurveda', 'kama ayurveda', 'biotique', 'kapiva',
                'dhootapapeshwar', 'sri sri ayurveda', 'hamdard', 'mdh ayurveda', 'vaidyaratnam',
                
                # Fitness & Wellness
                'cult fit', 'cure fit', 'gold gym', 'anytime fitness', 'fitness first', 'snap fitness',
                'trueweight', 'healthifyme', 'fittr', 'stepathlon', 'fitpass', 'fitternity', 'growfitter',
                'sarva yoga', 'yogisthaan', 'atmantan', 'ananda in the himalayas', 'soukya', 'kairali',
                'niraamaya', 'somatheeram', 'devaaya', 'naad wellness', 'atmantan', 'vana', 'ananda spa'
            ],
            
            # Education - Indian Institutions
            'education': [
                # Schools
                'dav', 'dps', 'delhi public school', 'kendriya vidyalaya', 'kv', 'jawahar navodaya vidyalaya',
                'jnv', 'sainik school', 'central school', 'army public school', 'air force school', 'naval school',
                'ryan international', 'amity', 'gd goenka', 'mount litera', 'shiv nadar', 'doon school',
                'mayo college', 'welham', 'scindia', 'modern school', 'springdales', 'carmel', 'la martiniere',
                
                # Coaching Centers
                'allen', 'aakash', 'fiitjee', 'resonance', 'bansal', 'vibrant', 'narayana', 'sri chaitanya',
                'career launcher', 'time', 'ims', 'byju\'s', 'unacademy', 'vedantu', 'toppr', 'doubtnut',
                'meritnation', 'embibe', 'gradeup', 'testbook', 'oliveboard', 'adda247', 'made easy',
                'gate academy', 'ace academy', 'vajiram & ravi', 'vision ias', 'insights ias', 'plutus ias',
                
                # Universities & Colleges
                'iit', 'nit', 'iiit', 'aiims', 'iim', 'xlri', 'bits', 'vit', 'srm', 'manipal', 'amity',
                'lpu', 'du', 'jnu', 'bhu', 'jamia', 'aligarh muslim university', 'amu', 'delhi university',
                'mumbai university', 'calcutta university', 'madras university', 'osmania university',
                'anna university', 'jadavpur university', 'banaras hindu university', 'andhra university',
                
                # Online Learning Platforms
                'byju\'s', 'unacademy', 'vedantu', 'toppr', 'doubtnut', 'extramarks', 'meritnation',
                'embibe', 'gradeup', 'testbook', 'oliveboard', 'adda247', 'khan academy', 'coursera',
                'udemy', 'edx', 'skillshare', 'great learning', 'upgrad', 'simplilearn', 'scaler',
                'masai school', 'newton school', 'almabetter', 'geekster', 'coding ninjas', 'interviewbit',
                
                # Educational Materials
                'ncert', 'schand', 'pearson', 'macmillan', 'oxford', 'cambridge', 'arihant', 'disha',
                'mtg', 'cengage', 'oswaal', 'universal', 'ratna sagar', 'evergreen', 'together with',
                'full marks', 'rd sharma', 'rs aggarwal', 'hc verma', 'pradeep', 'morrison and boyd'
            ],
            
            # Government & Services - Indian Public Services
            'government': [
                # Government Departments
                'income tax', 'gst', 'customs', 'passport', 'aadhaar', 'pan card', 'election commission',
                'municipality', 'corporation', 'panchayat', 'tehsil', 'collector office', 'district office',
                'police', 'traffic police', 'rto', 'transport department', 'electricity board', 'water board',
                'land records', 'registration office', 'post office', 'india post', 'court fee', 'stamp duty',
                
                # Public Services
                'bsnl', 'mtnl', 'indian railways', 'irctc', 'india post', 'lic', 'epfo', 'esic', 'uidai',
                'passport seva', 'vfs global', 'municipal corporation', 'electricity board', 'water board',
                'gas agency', 'property tax', 'professional tax', 'road tax', 'vehicle registration',
                
                # Digital Services
                'digilocker', 'umang', 'mygov', 'e-filing', 'gst portal', 'e-way bill', 'e-shram',
                'cowin', 'aarogya setu', 'bhim', 'fastag', 'e-nam', 'swayam', 'diksha', 'e-pathshala',
                
                # Legal Services
                'court fee', 'stamp duty', 'legal', 'lawyer', 'advocate', 'notary', 'affidavit',
                'registration', 'documentation', 'will', 'power of attorney', 'agreement', 'contract',
                'vakalatnama', 'bail', 'petition', 'case filing', 'legal heir', 'succession certificate'
            ],
            
            # Telecom - Indian Providers
            'telecom': [
                # Mobile & Internet Providers
                'jio', 'airtel', 'vodafone idea', 'vi', 'bsnl', 'mtnl', 'jio fiber', 'airtel xstream',
                'act fibernet', 'hathway', 'tata sky broadband', 'you broadband', 'excitel', 'spectra',
                'tikona', 'nextra', 'asianet', 'railwire', 'alliance broadband', 'den broadband',
                
                # Recharge & Bill Payment
                'mobile recharge', 'prepaid recharge', 'postpaid bill', 'data pack', 'data recharge',
                'talktime', 'special tariff', 'unlimited plan', 'combo plan', 'annual plan', 'monthly plan',
                'broadband bill', 'fiber bill', 'internet bill', 'landline bill', 'dth recharge',
                
                # Mobile Accessories
                'mobile case', 'screen guard', 'tempered glass', 'charger', 'adapter', 'power bank',
                'earphones', 'headphones', 'bluetooth', 'speaker', 'memory card', 'otg cable', 'data cable'
            ],
            
            # Entertainment - Indian Media & Events
            'entertainment': [
                # Streaming Platforms
                'netflix', 'amazon prime', 'hotstar', 'disney+ hotstar', 'sony liv', 'zee5', 'voot',
                'alt balaji', 'mx player', 'jiocinema', 'sun nxt', 'hoichoi', 'aha', 'manorama max',
                'discovery+', 'lionsgate play', 'apple tv+', 'eros now', 'shemaroo me', 'hungama play',
                
                # Music Streaming
                'spotify', 'jiosaavn', 'wynk music', 'gaana', 'amazon music', 'youtube music',
                'hungama music', 'resso', 'apple music', 'soundcloud', 'raaga', 'saregama carvaan',
                
                # Cinema & Theatres
                'pvr', 'inox', 'cinepolis', 'carnival cinemas', 'miraj cinemas', 'mukta a2', 'srs cinemas',
                'movie max', 'big cinemas', 'asian cinemas', 'imax', 'prasads', 'urvashi', 'rex', 'galaxy',
                'sterling', 'regal', 'eros', 'maratha mandir', 'gaiety galaxy', 'prithvi theatre',
                
                # Events & Ticketing
                'bookmyshow', 'paytm insider', 'skillbox', 'townscript', 'zomaland', 'vh1 supersonic',
                'sunburn', 'nh7 weekender', 'lollapalooza', 'comic con', 'india art fair', 'kala ghoda',
                'jaipur literature festival', 'meta theatre', 'prithvi theatre festival', 'serendipity arts'
            ],
            
            # Clothing & Fashion - Indian Brands
            'clothing': [
                # Clothing Brands
                'fabindia', 'biba', 'w for woman', 'global desi', 'and', 'aurelia', 'manyavar', 'mohey',
                'raymond', 'peter england', 'louis philippe', 'van heusen', 'allen solly', 'park avenue',
                'monte carlo', 'wills lifestyle', 'indian terrain', 'spykar', 'killer jeans', 'mufti',
                'woodland', 'red tape', 'bata', 'liberty', 'relaxo', 'khadim', 'metro shoes', 'inc.5',
                
                # Fashion Retailers
                'shoppers stop', 'lifestyle', 'westside', 'pantaloons', 'max', 'reliance trends',
                'v mart', 'brand factory', 'central', 'first cry', 'ajio', 'myntra', 'nykaa fashion',
                
                # Jewelry & Accessories
                'tanishq', 'kalyan jewellers', 'malabar gold', 'joyalukkas', 'pc jeweller', 'tribhovandas',
                'grt jewellers', 'jos alukkas', 'senco gold', 'carat lane', 'bluestone', 'melorra',
                'titan', 'fastrack', 'sonata', 'casio', 'fossil', 'timex', 'citizen', 'seiko', 'rado'
            ]
        }
        
        for category, keywords in categories.items():
            if any(keyword in description for keyword in keywords):
                return category
        
        return 'miscellaneous expenses'

def main():
    parser = argparse.ArgumentParser(description='Parse bank statements')
    parser.add_argument('file_path', help='Path to the PDF statement file')
    args = parser.parse_args()

    try:
        statement_parser = StatementParser(args.file_path)
        df = statement_parser.parse()
        
        # Convert DataFrame to dictionary format
        transactions = []
        for _, row in df.iterrows():
            transactions.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'amount': float(row['amount']),
                'description': str(row['description']) if 'description' in row else '',
                'category': str(row['category'])
            })

        # Calculate totals
        total_received = float(df[df['amount'] > 0]['amount'].sum())
        total_spent = float(df[df['amount'] < 0]['amount'].sum())
        
        # Calculate category breakdown
        category_breakdown = df[df['amount'] < 0].groupby('category')['amount'].sum().to_dict()
        category_breakdown = {k: float(v) for k, v in category_breakdown.items()}

        # Create response object
        response = {
            'transactions': transactions,
            'totalReceived': total_received,
            'totalSpent': total_spent,
            'categoryBreakdown': category_breakdown
        }

        # Print JSON output
        print(json.dumps(response))
        sys.exit(0)

    except Exception as e:
        error_response = {'error': str(e)}
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 