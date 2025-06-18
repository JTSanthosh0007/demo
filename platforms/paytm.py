import streamlit as st
from statement_parser import StatementParser
import pandas as pd
import time

def show_paytm_page(username=None):
    st.title("Paytm Statement Analysis")
    
    uploaded_file = st.file_uploader("Upload your Paytm statement (PDF)", type=['pdf'])
    
    if uploaded_file:
        parser = StatementParser(uploaded_file)
        df = parser.parse()
        if not df.empty:
            st.success("Statement processed successfully!")
            st.dataframe(df)

    # Use full page width and clean styling
    st.markdown("""
        <style>
        .block-container {
            padding: 1rem 3rem !important;
            max-width: 100%;
        }
        .platform-header {
            padding: 1.5rem;
            background: linear-gradient(45deg, rgba(40,40,40,0.9), rgba(60,60,60,0.9));
            border-radius: 0.75rem;
            margin: 0.5rem 0 1.5rem 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;  /* Limit the width */
        }
        .platform-header h1 {
            color: white;
            font-size: 1.8rem;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .platform-header p {
            color: #cccccc;
            font-size: 0.9rem;
            margin: 0;
            line-height: 1.4;
        }
        .upload-section {
            background: rgba(30,30,30,0.6);
            padding: 1.5rem;
            border-radius: 0.75rem;
            border: 1px solid rgba(255,255,255,0.1);
            text-align: center;
            margin-top: 1rem;
            max-width: 400px;  /* Limit the width */
        }
        .stButton button {
            background-color: #333333 !important;
            color: white !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            padding: 0.4rem 0.8rem !important;
            border-radius: 0.4rem !important;
            transition: all 0.3s ease !important;
            font-size: 0.9rem !important;
        }
        .stButton button:hover {
            background-color: #444444 !important;
            border-color: rgba(255,255,255,0.3) !important;
            transform: translateY(-2px);
        }
        /* Center the content */
        .main-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        }
        </style>
    """, unsafe_allow_html=True)

    # Wrap everything in a centered container
    st.markdown('<div class="main-content">', unsafe_allow_html=True)
    
    # Show header
    st.markdown(
        """
        <div class="platform-header">
            <h1>💰 Paytm Statement Analyzer</h1>
            <p>Upload your Paytm statement to analyze your transactions</p>
        </div>
        """, 
        unsafe_allow_html=True
    )
    
    # Upload section with better styling
    with st.container():
        st.markdown('<div class="upload-section">', unsafe_allow_html=True)
        uploaded_file = st.file_uploader(
            "Upload your Paytm statement (PDF)",
            type=['pdf']
        )
        
        if not uploaded_file:
            st.markdown("""
                <p style='color: #888888; font-size: 0.85rem; margin-top: 0.75rem;'>
                    Drag and drop your PDF file here or click Browse files
                </p>
            """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Close the main content wrapper
    st.markdown('</div>', unsafe_allow_html=True)
    
    if uploaded_file:
        try:
            # Show processing message
            with st.spinner('Processing your statement...'):
                # Initialize parser with the uploaded file
                parser = StatementParser(uploaded_file)
                
                # Parse the statement
                df = parser.parse()
                
                if df is not None and not df.empty:
                    # Create placeholder for transaction message
                    message_placeholder = st.empty()
                    message_placeholder.success(f"Successfully extracted {len(df)} transactions.")
                    
                    # Create another placeholder for processing message
                    process_placeholder = st.empty()
                    process_placeholder.success("Statement processed successfully!")
                    
                    # Wait for 3 seconds then clear the messages
                    time.sleep(3)
                    message_placeholder.empty()
                    process_placeholder.empty()
                    
                    # Basic Statistics
                    st.subheader("Transaction Summary")
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.metric("Total Transactions", len(df))
                    with col2:
                        # Check column names and adjust accordingly
                        amount_col = 'amount' if 'amount' in df.columns else 'Amount'
                        total_spent = df[df[amount_col] < 0][amount_col].abs().sum()
                        st.metric("Total Spent", f"₹{total_spent:,.2f}")
                    with col3:
                        total_received = df[df[amount_col] > 0][amount_col].sum()
                        st.metric("Total Received", f"₹{total_received:,.2f}")
                    
                    # Show transactions
                    st.subheader("Recent Transactions")
                    st.dataframe(df)
                else:
                    st.error("No transactions found in the statement.")
        except Exception as e:
            st.error(f"Error processing statement: {str(e)}")
            st.error("Please make sure you're uploading a valid Paytm statement.") 