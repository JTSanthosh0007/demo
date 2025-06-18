import streamlit as st
from statement_parser import StatementParser
import time
import pandas as pd
import logging
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

logger = logging.getLogger(__name__)

def clean_transaction_data(df):
    """Clean and prepare transaction data"""
    try:
        # Clean description column
        if 'description' in df.columns:
            # Handle encoding issues and remove special characters
            df['description'] = df['description'].apply(lambda x: str(x).encode('ascii', 'ignore').decode('ascii').strip())
        
        # Clean amount column - handle different formats
        if 'amount' in df.columns:
            df['amount'] = df['amount'].apply(lambda x: 
                pd.to_numeric(
                    str(x)
                    .replace('₹', '')
                    .replace(',', '')
                    .replace('CREDIT', '')
                    .replace('DEBIT', '')
                    .strip(), 
                    errors='coerce'
                )
            )
        
        # Clean date column
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            
        # Remove any rows with NaN values in critical columns
        df = df.dropna(subset=['amount', 'date'])
        
        return df
    
    except Exception as e:
        logger.error(f"Error in clean_transaction_data: {str(e)}")
        raise Exception("Error cleaning transaction data. Please check the statement format.")

def show_transaction_analysis(df):
    """Enhanced data visualization"""
    st.subheader("📊 Transaction Analysis")
    
    tab1, tab2, tab3, tab4 = st.tabs(["Timeline", "Categories", "Monthly Trends", "Statistics"])
    
    with tab1:
        # Transaction Timeline
        st.subheader("Transaction Timeline")
        df['date'] = pd.to_datetime(df['date'])
        
        # Daily transactions
        daily_transactions = df.set_index('date')['amount'].resample('D').sum()
        
        fig_timeline = px.line(
            daily_transactions.reset_index(),
            x='date',
            y='amount',
            title='Daily Transaction Pattern',
            labels={'amount': 'Amount (₹)', 'date': 'Date'}
        )
        fig_timeline.update_layout(template='plotly_dark')
        st.plotly_chart(fig_timeline, use_container_width=True)
    
    with tab2:
        # Category Analysis
        col1, col2 = st.columns(2)
        
        with col1:
            # Spending by Category
            category_spending = df.groupby('category')['amount'].sum().abs()
            fig_category = px.pie(
                values=category_spending.values,
                names=category_spending.index,
                title='Spending by Category'
            )
            fig_category.update_layout(template='plotly_dark')
            st.plotly_chart(fig_category)
        
        with col2:
            # Transaction Count by Category
            category_count = df['category'].value_counts()
            fig_count = px.bar(
                x=category_count.index,
                y=category_count.values,
                title='Number of Transactions by Category'
            )
            fig_count.update_layout(template='plotly_dark')
            st.plotly_chart(fig_count)
    
    with tab3:
        # Monthly Trends
        df['month'] = df['date'].dt.strftime('%Y-%m')
        monthly_data = df.groupby(['month', 'category'])['amount'].sum().reset_index()
        
        fig_monthly = px.bar(
            monthly_data,
            x='month',
            y='amount',
            color='category',
            title='Monthly Spending by Category',
            labels={'amount': 'Amount (₹)', 'month': 'Month'}
        )
        fig_monthly.update_layout(template='plotly_dark')
        st.plotly_chart(fig_monthly, use_container_width=True)
    
    with tab4:
        # Transaction Statistics
        col1, col2 = st.columns(2)
        
        with col1:
            # Transaction Size Distribution
            fig_hist = px.histogram(
                df,
                x='amount',
                nbins=50,
                title='Transaction Amount Distribution',
                labels={'amount': 'Amount (₹)', 'count': 'Number of Transactions'}
            )
            fig_hist.update_layout(template='plotly_dark')
            st.plotly_chart(fig_hist, use_container_width=True)
        
        with col2:
            # Time-of-Day Analysis if available
            if 'time' in df.columns:
                df['hour'] = pd.to_datetime(df['time']).dt.hour
                hourly_transactions = df.groupby('hour')['amount'].count()
                
                fig_time = px.line(
                    x=hourly_transactions.index,
                    y=hourly_transactions.values,
                    title='Transaction Frequency by Hour',
                    labels={'x': 'Hour of Day', 'y': 'Number of Transactions'}
                )
                fig_time.update_layout(template='plotly_dark')
                st.plotly_chart(fig_time, use_container_width=True)

def show_phonepe_page(username):
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
            max-width: 400px;
        }
        </style>
    """, unsafe_allow_html=True)

    # Show header
    st.markdown(
        """
        <div class="platform-header">
            <h1>📱 PhonePe Statement Analyzer</h1>
            <p>Upload your PhonePe statement to analyze your transactions</p>
        </div>
        """, 
        unsafe_allow_html=True
    )

    uploaded_file = st.file_uploader(
        "Upload your PhonePe statement (PDF)", 
        type=["pdf"]
    )

    if uploaded_file:
        with st.spinner("Analyzing your statement... Please wait."):
            try:
                parser = StatementParser(uploaded_file)
                df = parser.parse()
                
                # Log the raw DataFrame for debugging
                logger.info(f"Raw DataFrame after parsing: {df}")

                if df is not None and not df.empty:
                    # Clean the data
                    df = clean_transaction_data(df)
                    
                    # Log the cleaned DataFrame for debugging
                    logger.info(f"Cleaned DataFrame: {df}")

                    st.success("Statement processed successfully!")
                    
                    # Transaction Summary Section
                    st.subheader("💳 Transaction Summary")
                    col1, col2, col3, col4, col5 = st.columns(5)
                    
                    with col1:
                        total_transactions = len(df)
                        st.metric("Total Transactions", total_transactions)
                    
                    with col2:
                        credits = df[df['amount'] > 0]['amount'].sum()
                        st.metric("Total Credits", f"₹{credits:,.2f}")
                    
                    with col3:
                        debits = abs(df[df['amount'] < 0]['amount'].sum())
                        st.metric("Total Debits", f"₹{debits:,.2f}")
                    
                    with col4:
                        net_balance = credits - debits
                        st.metric("Net Balance", f"₹{net_balance:,.2f}")
                    
                    with col5:
                        avg_transaction = df['amount'].abs().mean()
                        st.metric("Avg. Transaction", f"₹{avg_transaction:,.2f}")

                    # Search and Filter Section
                    st.subheader("🔍 Search & Filter")
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        search_term = st.text_input("Search in descriptions", "")
                    with col2:
                        if 'type' in df.columns:
                            selected_types = st.multiselect(
                                "Filter by type",
                                options=['All'] + list(df['type'].unique()),
                                default='All'
                            )

                    # Apply filters
                    filtered_df = df.copy()
                    if search_term:
                        filtered_df = filtered_df[
                            filtered_df['description'].str.contains(search_term, case=False, na=False)
                        ]
                    if 'type' in df.columns and selected_types and 'All' not in selected_types:
                        filtered_df = filtered_df[filtered_df['type'].isin(selected_types)]

                    # Show transaction analysis
                    show_transaction_analysis(filtered_df)
                    
                    # Recent Transactions
                    st.subheader("📝 Recent Transactions")
                    st.dataframe(
                        filtered_df.sort_values('date', ascending=False),
                        column_config={
                            "date": "Date",
                            "amount": st.column_config.NumberColumn(
                                "Amount",
                                format="₹%.2f"
                            ),
                            "category": "Category",
                            "description": "Description"
                        },
                        hide_index=True,
                        use_container_width=True
                    )

                else:
                    st.error("No transactions found in the statement.")
                    st.info("Please ensure you've uploaded a valid PhonePe statement")

            except Exception as e:
                st.error(f"Error processing statement: {str(e)}")
                logger.error(f"Error in show_phonepe_page: {str(e)}")
                st.info("Please try uploading the statement again")
