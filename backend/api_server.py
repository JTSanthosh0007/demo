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
import shutil

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
    # Create a temporary file path
    temp_path = f"temp_{file.filename}"
    try:
        # Save uploaded file to the temporary path
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse the statement using the file path
        parser = StatementParser(temp_path)
        df = parser.parse()

        # Convert to dictionary format
        transactions = df.to_dict('records')

        # Calculate summary statistics
        total_spent = sum(t['amount'] for t in transactions if t['amount'] < 0)
        total_received = sum(t['amount'] for t in transactions if t['amount'] > 0)

        # Calculate category breakdown
        category_breakdown = {}
        for t in transactions:
            if t['amount'] < 0:  # Only consider spending
                category = t['category']
                category_breakdown[category] = category_breakdown.get(category, 0) + t['amount']

        return {
            "transactions": transactions,
            "totalSpent": total_spent,
            "totalReceived": total_received,
            "categoryBreakdown": category_breakdown
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/analyze-kotak-statement")
async def analyze_kotak_statement(file: UploadFile = File(...)):
    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        
        # We need to create a file-like object with a 'read' method
        class FileObject:
            def __init__(self, content):
                self._content = content
            def read(self):
                return self._content

        parser = KotakParser(FileObject(content))
        df = parser.parse()
        
        # Convert to dictionary format
        transactions = df.to_dict('records')
        
        # Calculate summary statistics
        total_spent = sum(t['amount'] for t in transactions if t['amount'] < 0)
        total_received = sum(t['amount'] for t in transactions if t['amount'] > 0)
        
        # Calculate category breakdown
        category_breakdown = {}
        for t in transactions:
            if t['amount'] < 0:  # Only consider spending
                category = t.get('category', 'Uncategorized')
                category_breakdown[category] = category_breakdown.get(category, 0) + t['amount']
        
        return {
            "transactions": transactions,
            "totalSpent": total_spent,
            "totalReceived": total_received,
            "categoryBreakdown": category_breakdown
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Kotak statement: {str(e)}")

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