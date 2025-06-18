import streamlit as st
from platforms.router import route_to_platform
from supabase_config import get_client
from datetime import datetime

def display_grid(platforms, all_platforms):
    """Helper function to display platforms in a grid"""
    cols = st.columns(4)
    for i, platform_name in enumerate(platforms):
        with cols[i % 4]:
            # Get platform details
            platform = all_platforms[platform_name]
            
            # Determine if platform is available
            is_available = platform['status'] == 'Available'
            
            # Create a card with visual indication of availability
            card_class = "platform-card" if is_available else "platform-card disabled"
            status_class = "status-available" if is_available else "status-coming-soon"
            
            st.markdown(f"""
                <div class="{card_class}">
                    <div class="platform-icon">{platform['icon']}</div>
                    <div class="platform-name">{platform_name}</div>
                    <div class="platform-status {status_class}">{platform['status']}</div>
                </div>
            """, unsafe_allow_html=True)
            
            # Button with the same styling as the card
            if st.button(f"Select", key=f"btn_{platform_name}", 
                        disabled=not is_available,
                        use_container_width=True):
                st.session_state.selected_platform = platform_name
                st.rerun()

def show_platform_select(username):
    st.title(f"Welcome {username}! 👋")
    
    # Add custom CSS
    st.markdown("""
        <style>
        .platform-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        .platform-card {
            background: #1A1A1A;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            min-height: 160px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
        }
        .platform-logo {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 500;
            color: white;
            margin-bottom: 4px;
        }
        .platform-name {
            color: white;
            font-size: 14px;
            margin: 0;
            font-weight: 400;
        }
        .platform-status {
            font-size: 12px;
            margin: 0;
            line-height: 1.2;
        }
        .status-available {
            color: #4CAF50;
        }
        .status-coming-soon {
            color: rgba(255, 255, 255, 0.5);
        }
        .section-header {
            color: #2196F3;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 24px 0 16px 0;
        }
        .stButton > button {
            background-color: #2196F3 !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 8px !important;
            font-size: 14px !important;
            font-weight: 400 !important;
            height: 36px !important;
            width: 100% !important;
            margin-top: 8px !important;
            text-transform: none !important;
        }
        .stButton > button:disabled {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: rgba(255, 255, 255, 0.5) !important;
        }
        .activity-item {
            background: #1A1A1A;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .activity-platform {
            color: white;
            font-weight: 500;
        }
        .activity-amount {
            color: #4CAF50;
            font-weight: 500;
        }
        .activity-date {
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
        }
        </style>
    """, unsafe_allow_html=True)

    # Define all platforms
    all_platforms = {
        'WhatsApp Pay': {
            'status': 'Coming Soon', 
            'category': 'UPI',
            'logo': '<div class="platform-logo" style="background: #25D366;">Wa</div>'
        },
        'Paytm UPI': {
            'status': 'Available', 
            'category': 'UPI',
            'logo': '<div class="platform-logo" style="background: #00B9F1;">Pay</div>'
        },
        'PhonePe': {
            'status': 'Available', 
            'category': 'UPI',
            'logo': '<div class="platform-logo" style="background: #5F259F;">Pe</div>'
        },
        'Google Pay': {
            'status': 'Coming Soon', 
            'category': 'UPI',
            'logo': '<div class="platform-logo" style="background: #FFFFFF; color: #000;">G</div>'
        },
        'BHIM': {
            'status': 'Coming Soon', 
            'category': 'UPI',
            'logo': '<div class="platform-logo" style="background: #00345B;">IN</div>'
        },
        'Amazon Pay': {
            'status': 'Coming Soon', 
            'category': 'UPI',
            'logo': '<div class="platform-logo" style="background: #FF9900;">Am</div>'
        },
        # Banks (only shown when searched)
        'SBI': {
            'status': 'Coming Soon', 
            'category': 'Public Sector Bank', 
            'full_name': 'State Bank of India',
            'logo': '<div class="platform-logo" style="background: #2d4b8e;">SBI</div>'
        },
        'BOB': {
            'status': 'Coming Soon', 
            'category': 'Public Sector Bank', 
            'full_name': 'Bank of Baroda',
            'logo': '<div class="platform-logo" style="background: #2d4b8e;">BOB</div>'
        },
        'HDFC': {
            'status': 'Coming Soon', 
            'category': 'Private Sector Bank', 
            'full_name': 'HDFC Bank',
            'logo': '<div class="platform-logo" style="background: #004C8F;">HDFC</div>'
        },
        'ICICI': {
            'status': 'Coming Soon', 
            'category': 'Private Sector Bank', 
            'full_name': 'ICICI Bank',
            'logo': '<div class="platform-logo" style="background: #F58220;">ICICI</div>'
        }
    }

    # Search box
    search = st.text_input("🔍 Search your bank or payment platform")

    # UPI Apps section header
    st.markdown('<div class="section-header">🔄 UPI Payment Apps</div>', unsafe_allow_html=True)

    if not search:
        # Show only UPI apps by default
        upi_platforms = {name: details for name, details in all_platforms.items() 
                        if details['category'] == 'UPI'}
        
        cols = st.columns(4)
        for idx, (name, details) in enumerate(upi_platforms.items()):
            with cols[idx % 4]:
                st.markdown(f"""
                    <div class="platform-card">
                        {details['logo']}
                        <div class="platform-name">{name}</div>
                        <div class="platform-status {'status-available' if details['status'] == 'Available' else 'status-coming-soon'}">
                            {details['status']}
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                
                if st.button(
                    "Select",
                    key=f"upi_{name.lower().replace(' ', '_')}",
                    disabled=details['status'] != 'Available',
                    use_container_width=True
                ):
                    st.session_state.selected_platform = name
                    st.rerun()

    if search:
        # Show all platforms if search is "all"
        if search.lower().strip() == "all":
            # Display all categories
            for category in ['UPI', 'Public Sector Bank', 'Private Sector Bank']:
                category_platforms = {
                    name: details for name, details in all_platforms.items()
                    if details['category'] == category
                }
                
                if category_platforms:
                    icon = "🔄" if category == "UPI" else "🏦"
                    st.markdown(f'<div class="section-header">{icon} {category}</div>', unsafe_allow_html=True)
                    
                    cols = st.columns(4)
                    for idx, (name, details) in enumerate(category_platforms.items()):
                        with cols[idx % 4]:
                            display_name = details.get('full_name', name)
                            st.markdown(f"""
                                <div class="platform-card">
                                    {details.get('logo', '')}
                                    <div class="platform-name">{display_name}</div>
                                    <div class="platform-status {'status-available' if details['status'] == 'Available' else 'status-coming-soon'}">
                                        {details['status']}
                                    </div>
                                </div>
                            """, unsafe_allow_html=True)
                            
                            if st.button(
                                "Select",
                                key=f"all_{name.lower().replace(' ', '_')}",
                                disabled=details['status'] != 'Available',
                                use_container_width=True
                            ):
                                st.session_state.selected_platform = name
                                st.rerun()
        else:
            # Existing search functionality
            search = search.lower()
            filtered_platforms = {
                name: details for name, details in all_platforms.items()
                if (search in name.lower() or 
                    search in details.get('full_name', '').lower() or 
                    search in details['category'].lower())
            }
            
            if filtered_platforms:
                # Display filtered results
                for category in ['UPI', 'Public Sector Bank', 'Private Sector Bank']:
                    category_platforms = {
                        name: details for name, details in filtered_platforms.items()
                        if details['category'] == category
                    }
                    
                    if category_platforms:
                        icon = "🔄" if category == "UPI" else "🏦"
                        st.markdown(f'<div class="section-header">{icon} {category}</div>', unsafe_allow_html=True)
                        
                        cols = st.columns(4)
                        for idx, (name, details) in enumerate(category_platforms.items()):
                            with cols[idx % 4]:
                                display_name = details.get('full_name', name)
                                st.markdown(f"""
                                    <div class="platform-card">
                                        {details.get('logo', '')}
                                        <div class="platform-name">{display_name}</div>
                                        <div class="platform-status {'status-available' if details['status'] == 'Available' else 'status-coming-soon'}">
                                            {details['status']}
                                        </div>
                                    </div>
                                """, unsafe_allow_html=True)
                                
                                if st.button(
                                    "Select",
                                    key=f"search_{name.lower().replace(' ', '_')}",
                                    disabled=details['status'] != 'Available',
                                    use_container_width=True
                                ):
                                    st.session_state.selected_platform = name
                                    st.rerun()
            else:
                st.info("No platforms found matching your search. Try a different term.")

    # Comment out the Recent Activity section properly
    """
    # Add Recent Activity section
    st.markdown('<div class="recent-activity">', unsafe_allow_html=True)
    st.markdown('<h2>Recent Activity</h2>', unsafe_allow_html=True)

    # Get recent activity from Supabase
    supabase = get_client()
    try:
        response = supabase.table('transactions').select('*')\\
            .eq('username', username)\\
            .order('created_at', desc=True)\\
            .limit(5)\\
            .execute()
        
        recent_transactions = response.data

        if recent_transactions:
            # Display recent transactions
            for transaction in recent_transactions:
                st.markdown(
                    f'''
                    <div class="activity-item">
                        <div class="activity-platform">{transaction['platform']}</div>
                        <div class="activity-amount">₹{transaction['amount']}</div>
                        <div class="activity-date">{transaction['created_at']}</div>
                    </div>
                    ''',
                    unsafe_allow_html=True
                )
        else:
            st.markdown(
                '''
                <div class="activity-alert">
                    ⚠️ No recent activity to show
                </div>
                ''',
                unsafe_allow_html=True
            )

    except Exception as e:
        st.markdown(
            '''
            <div class="activity-alert">
                ⚠️ No recent activity to show
            </div>
            ''',
            unsafe_allow_html=True
        )

    st.markdown('</div>', unsafe_allow_html=True)
    """

    # Route to platform if selected
    if 'selected_platform' in st.session_state:
        route_to_platform(st.session_state.selected_platform, username) 