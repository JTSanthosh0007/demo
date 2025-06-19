from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn
from statement_parser import StatementParser
from kotak_parser import KotakParser
from unlock_pdf import unlock_pdf
import io
import os
import tempfile
import uuid

app = FastAPI()

# Enable CORS with simpler configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    return Response(status_code=204)

class FileObject:
    def __init__(self, filename, content):
        self.name = filename
        self._content = content

    def read(self, *args):
        return self._content

@app.post("/analyze")
async def analyze_statement(
    file: UploadFile = File(...),
    platform: str = Form(...)
):
    try:
        # Use the correct parser based on the platform, passing the file-like object directly
        if platform == 'kotak':
            # The parser now expects the file object and filename
            parser = KotakParser(file.file, file.filename)
        elif platform == 'phonepe':
            # The parser now expects the file object and filename
            parser = StatementParser(file.file, file.filename)
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")

        df, page_count = parser.parse()

        # Check if DataFrame is empty or None
        if df is None or df.empty:
            return {
                "transactions": [],
                "totalSpent": 0,
                "totalReceived": 0,
                "detailedCategoryBreakdown": [],
                "pageCount": 0
            }

        # Convert date column to string to avoid JSON serialization issues
        if 'date' in df.columns:
            df['date'] = df['date'].astype(str)

        # Convert to dictionary format
        transactions = df.to_dict('records')

        # Calculate summary statistics
        total_spent = sum(t['amount'] for t in transactions if t.get('amount') and t['amount'] < 0)
        total_received = sum(t['amount'] for t in transactions if t.get('amount') and t['amount'] > 0)
        credit_count = sum(1 for t in transactions if t.get('amount') and t['amount'] > 0)
        debit_count = sum(1 for t in transactions if t.get('amount') and t['amount'] < 0)
        
        all_amounts = [t['amount'] for t in transactions if t.get('amount') is not None]
        highest_transaction = max(all_amounts) if all_amounts else 0
        lowest_transaction = min(all_amounts) if all_amounts else 0

        # Calculate detailed category breakdown
        category_details = {}
        for t in transactions:
            if t.get('amount') and t['amount'] < 0:  # Only consider spending
                category = t.get('category', 'Uncategorized')
                if category not in category_details:
                    category_details[category] = {
                        "amount": 0,
                        "count": 0,
                        "transactions": []
                    }
                category_details[category]["amount"] += t['amount']
                category_details[category]["count"] += 1
                category_details[category]["transactions"].append(t)

        detailed_category_breakdown = []
        if total_spent < 0:
            for category, details in category_details.items():
                amount = abs(details['amount'])
                percentage = (amount / abs(total_spent)) * 100
                detailed_category_breakdown.append({
                    "category": category,
                    "amount": amount,
                    "count": details['count'],
                    "percentage": round(percentage, 2),
                    "transactions": sorted(details['transactions'], key=lambda x: x['date'], reverse=True)
                })

        # Sort categories by amount spent
        detailed_category_breakdown.sort(key=lambda x: x['amount'], reverse=True)

        return {
            "transactions": transactions,
            "summary": {
                "totalReceived": total_received,
                "totalSpent": total_spent,
                "balance": total_received + abs(total_spent),
                "creditCount": credit_count,
                "debitCount": debit_count,
                "totalTransactions": len(transactions),
                "highestTransaction": highest_transaction,
                "lowestTransaction": lowest_transaction,
            },
            "detailedCategoryBreakdown": detailed_category_breakdown,
            "pageCount": page_count,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Check if the error is due to a password-protected PDF
        if "permission" in str(e).lower() or "encrypted" in str(e).lower():
            raise HTTPException(
                status_code=400, 
                detail="The provided Kotak PDF statement appears to be password-protected. Please unlock it first using the PDF Unlocker tool."
            )
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while parsing the file: {str(e)}")

@app.post("/unlock-pdf")
async def unlock_pdf_endpoint(file: UploadFile = File(...), password: str = Form(...)):
    # Create temporary files to work with PyPDF2
    input_path = ""
    output_path = ""
    try:
        # Save uploaded file to a temporary file
        input_suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=input_suffix) as tmp_in:
            content = await file.read()
            tmp_in.write(content)
            input_path = tmp_in.name

        # Create a path for the output file
        output_path = f"{tempfile.gettempdir()}/{uuid.uuid4()}.pdf"

        # Unlock the PDF
        unlock_pdf(input_path, output_path, password)

        # Stream the unlocked file back to the client
        def file_generator():
            with open(output_path, "rb") as f:
                yield from f
            # Clean up the output file after sending
            os.unlink(output_path)
        
        # Clean up input file
        os.unlink(input_path)

        return StreamingResponse(file_generator(), media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename={os.path.splitext(file.filename)[0]}_unlocked.pdf"
        })

    except Exception as e:
        # Clean up files if they exist
        if input_path and os.path.exists(input_path):
            os.unlink(input_path)
        if output_path and os.path.exists(output_path):
            os.unlink(output_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 