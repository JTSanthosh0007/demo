import streamlit as st
from statement_parser import StatementParser

def show_googlepay_page(username):
    st.title(f"💳 Google Pay Statement Analyzer - Welcome {username}!")
    st.markdown("""
    Analyze your Google Pay statements securely and get instant insights.
    Upload your Google Pay transaction statement in PDF format.
    """)

    uploaded_file = st.file_uploader(
        "Upload your Google Pay statement (PDF)", 
        type=["pdf"],
        help="Your file is processed securely and never stored"
    )

    if uploaded_file:
        with st.spinner("Analyzing your statement..."):
            parser = StatementParser(uploaded_file)
            df = parser.parse()
            
            # Show basic stats and visualizations (same as PhonePe)
            # ... rest of the analysis code ... 