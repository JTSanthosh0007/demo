'use client';
import { useRef, useState } from 'react';

export default function PdfUpload() {
  const fileInputRef = useRef(null);
  const [showPermission, setShowPermission] = useState(false);

  const handleUploadClick = () => {
    setShowPermission(true);
  };

  const handlePermission = (granted) => {
    setShowPermission(false);
    if (granted) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      // Handle the PDF upload logic here (e.g., upload to Supabase Storage)
      alert(`PDF "${file.name}" selected!`);
    } else {
      alert('Please select a PDF file.');
    }
  };

  return (
    <div>
      <button onClick={handleUploadClick}>Upload PDF</button>
      {showPermission && (
        <div className="modal">
          <p>Do you allow this app to upload a PDF file?</p>
          <button onClick={() => handlePermission(true)}>Allow</button>
          <button onClick={() => handlePermission(false)}>Deny</button>
        </div>
      )}
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
