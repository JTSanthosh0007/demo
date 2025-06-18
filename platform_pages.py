import streamlit as st
from statement_parser import StatementParser

def show_platform_change_sidebar(current_platform):
    """Show platform change options in sidebar"""
    st.sidebar.markdown("### Change Platform")
    platforms = {
        'PhonePe': '📱',
        'Google Pay': '💳',
        'Paytm': '💰',
        'SuperMoney': '💸',
        'NAVI': '🏦',
        'Amazon Pay': '🛒',
        'WhatsApp Pay': '💬',
        'BHIM UPI': '🇮🇳',
        'Other': '🔄'
    }
    
    # Filter out current platform from options
    available_platforms = {k: v for k, v in platforms.items() if k != current_platform}
    
    # Create selectbox for platform change
    new_platform = st.sidebar.selectbox(
        "Switch to different platform:",
        options=list(available_platforms.keys()),
        format_func=lambda x: f"{available_platforms[x]} {x}"
    )
    
    if st.sidebar.button(f"Switch to {new_platform}"):
        st.session_state.selected_platform = new_platform
        st.rerun()

def show_phonepe_page(username):
    # Add platform change in sidebar
    show_platform_change_sidebar('PhonePe')
    
    # Add back button in sidebar
    if st.sidebar.button("← Back to Platform Selection"):
        # Clear the platform selection and rerun
        st.session_state.selected_platform = None
        st.rerun()
        
    st.title(f"📱 PhonePe Statement Analyzer - Welcome {username}!")
    st.markdown("""
    Analyze your PhonePe statements securely and get instant insights.
    Upload your PhonePe transaction statement in PDF format.
    """)

    uploaded_file = st.file_uploader(
        "Upload your PhonePe statement (PDF)", 
        type=["pdf"],
        help="Your file is processed securely and never stored"
    )

    if uploaded_file:
        with st.spinner("Analyzing your statement..."):
            parser = StatementParser(uploaded_file)
            df = parser.parse()
            
            # Show basic stats
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Credits", f"₹{df[df['amount'] > 0]['amount'].sum():,.2f}")
            with col2:
                st.metric("Total Debits", f"₹{abs(df[df['amount'] < 0]['amount'].sum()):,.2f}")
            with col3:
                st.metric("Net Flow", f"₹{df['amount'].sum():,.2f}")
            
            # Show transactions
            st.subheader("📊 Transaction History")
            st.dataframe(df)
            
            # Add visualizations
            st.subheader("📈 Spending Analysis")
            line_fig, pie_fig = parser.generate_spending_chart(df)
            col1, col2 = st.columns(2)
            with col1:
                st.plotly_chart(line_fig, use_container_width=True)
            with col2:
                st.plotly_chart(pie_fig, use_container_width=True)

def show_other_page(username, platform_name):
    # Add platform change in sidebar
    show_platform_change_sidebar(platform_name)
    
    # Add back button in sidebar
    if st.sidebar.button("← Back to Platform Selection"):
        # Clear the platform selection and rerun
        st.session_state.selected_platform = None
        st.rerun()
        
    st.title(f"{platform_name} Statement Analyzer - Welcome {username}!")
    st.markdown(f"""
    Analyze your {platform_name} statements securely and get instant insights.
    Please ensure your statement contains transaction dates, amounts, and descriptions.
    """)

    uploaded_file = st.file_uploader(
        f"Upload your {platform_name} statement (PDF)", 
        type=["pdf"],
        help="Your file is processed securely and never stored"
    )

    if uploaded_file:
        with st.spinner("Analyzing your statement..."):
            parser = StatementParser(uploaded_file)
            df = parser.parse()
            
            # Show basic stats
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Credits", f"₹{df[df['amount'] > 0]['amount'].sum():,.2f}")
            with col2:
                st.metric("Total Debits", f"₹{abs(df[df['amount'] < 0]['amount'].sum()):,.2f}")
            with col3:
                st.metric("Net Flow", f"₹{df['amount'].sum():,.2f}")
            
            # Show transactions
            st.subheader("📊 Transaction History")
            st.dataframe(df)
            
            # Add visualizations
            st.subheader("📈 Spending Analysis")
            line_fig, pie_fig = parser.generate_spending_chart(df)
            col1, col2 = st.columns(2)
            with col1:
                st.plotly_chart(line_fig, use_container_width=True)
            with col2:
                st.plotly_chart(pie_fig, use_container_width=True) 