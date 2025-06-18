import streamlit as st
from statement_parser import StatementParser
import time
import traceback
import logging

# Configure logging
logger = logging.getLogger(__name__)

def show_supermoney_page(username):
    st.markdown(f"""
        <h3 style='
            font-size: 1.5rem;
            color: #FFFFFF;
            margin-bottom: 1rem;
            font-weight: 700;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        '>💸 <span style='color: #FFFFFF;'>SuperMoney Statement Analyzer</span> - Welcome <span style='color: #FFFFFF;'>{username}</span>!</h3>
    """, unsafe_allow_html=True)

    st.markdown("""
        <div style='
            font-size: 1rem;
            color: #FFFFFF;
            margin-bottom: 1rem;
            line-height: 1.4;
            opacity: 0.8;
        '>
            Analyze your SuperMoney statements securely and get instant insights.<br>
            Upload your SuperMoney transaction statement in PDF format.
        </div>
    """, unsafe_allow_html=True)

    uploaded_file = st.file_uploader(
        "Upload your SuperMoney statement (PDF)", 
        type=["pdf"],
        help="Your file is processed securely and never stored"
    )

    if uploaded_file:
        try:
            logger.info(f"Processing SuperMoney statement: {uploaded_file.name}")
            
            with st.spinner("Analyzing your statement..."):
                parser = StatementParser(uploaded_file)
                df = parser.parse()
                
                # Log DataFrame info
                logger.info(f"Parsed DataFrame columns: {df.columns.tolist()}")
                logger.info(f"Number of transactions found: {len(df)}")
                
                # Validate DataFrame has required columns
                required_columns = ['date', 'amount', 'description', 'category']
                missing_columns = [col for col in required_columns if col not in df.columns]
                
                if missing_columns:
                    logger.error(f"Missing required columns: {missing_columns}")
                    st.error(f"Invalid statement format. Missing columns: {', '.join(missing_columns)}")
                    st.info("Please make sure you're uploading a SuperMoney statement.")
                    return
                
                if df.empty:
                    logger.warning("No transactions found in the DataFrame")
                    st.warning("No transactions found in the statement.")
                    st.info("Please check if this is a valid SuperMoney statement.")
                    return
                
                try:
                    # Calculate net flow
                    net_flow = df['amount'].sum()
                    logger.info(f"Calculated net flow: {net_flow}")
                    
                    # Show basic stats
                    credits = df[df['amount'] > 0]['amount'].sum()
                    debits = abs(df[df['amount'] < 0]['amount'].sum())
                    logger.info(f"Total Credits: {credits}, Total Debits: {debits}")
                    
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Total Credits", f"₹{credits:,.2f}")
                    with col2:
                        st.metric("Total Debits", f"₹{debits:,.2f}")
                    with col3:
                        st.metric("Net Flow", f"₹{net_flow:,.2f}")
                    
                    # Show warning if net flow is negative
                    if net_flow < 0:
                        st.warning(f"⚠️ Your spending exceeds your credits by ₹{abs(net_flow):,.2f}")
                    
                    # Show transaction history
                    st.header("📊 Transaction History")
                    
                    # Add custom styling
                    st.markdown("""
                        <style>
                        .transaction-table {
                            background-color: #2d2d2d;
                            border-radius: 10px;
                            padding: 20px;
                            margin: 10px 0px;
                        }
                        </style>
                        """, unsafe_allow_html=True)
                    
                    st.markdown('<div class="transaction-table">', unsafe_allow_html=True)
                    
                    # Display transactions with proper formatting
                    st.dataframe(
                        df[['date', 'description', 'amount', 'category']].style.format({
                            'amount': '₹{:,.2f}',
                            'date': lambda x: x.strftime('%d %b %Y')
                        }),
                        use_container_width=True
                    )
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                    # Generate spending analysis if there are transactions
                    if len(df) > 0:
                        st.markdown("""
                            <style>
                            .spending-analysis {
                                background-color: #2d2d2d;
                                padding: 20px;
                                border-radius: 10px;
                                backdrop-filter: blur(10px);
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                margin: 10px 0px;
                            }
                            </style>
                            """, unsafe_allow_html=True)
                            
                        with st.container():
                            st.markdown('<div class="spending-analysis">', unsafe_allow_html=True)
                            st.subheader("📈 Spending Analysis")
                            col1, col2 = st.columns(2)
                            
                            line_fig, pie_fig = parser.generate_spending_chart(df)
                            
                            with col1:
                                if line_fig is not None:
                                    line_fig.update_layout(
                                        paper_bgcolor='rgba(0,0,0,0)',
                                        plot_bgcolor='rgba(0,0,0,0)',
                                        font_color='#ffffff'
                                    )
                                    st.plotly_chart(line_fig, use_container_width=True)
                                else:
                                    st.info("Monthly spending trend not available.")
                                    
                            with col2:
                                if pie_fig is not None:
                                    pie_fig.update_layout(
                                        paper_bgcolor='rgba(0,0,0,0)',
                                        plot_bgcolor='rgba(0,0,0,0)',
                                        font_color='#ffffff'
                                    )
                                    st.plotly_chart(pie_fig, use_container_width=True)
                                else:
                                    st.info("Category distribution not available.")
                            st.markdown('</div>', unsafe_allow_html=True)
                    else:
                        st.info("No spending transactions found in the statement.")
                    
                except Exception as e:
                    logger.error(f"Error processing transactions: {str(e)}\n{traceback.format_exc()}")
                    st.error("Error processing transactions. Please try again.")
                    
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}\n{traceback.format_exc()}")
            st.error("Error processing the statement. Please make sure you're uploading a valid SuperMoney statement.") 