import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { jsPDF } from "jspdf";
import "./App.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ExtractPdf = () => {
  const [numPages, setNumPages] = useState(null);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      setPdfFile(file);
      setNumPages(null);
      setPdfData(e.target.result);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleCheckboxChange = (event) => {
    const page = parseInt(event.target.value, 10);
    const updatedSelectedPages = new Set(selectedPages);

    if (event.target.checked) {
      updatedSelectedPages.add(page);
    } else {
      updatedSelectedPages.delete(page);
    }

    setSelectedPages(updatedSelectedPages);
  };

  async function extractPDFnew() {
    if (!pdfData || selectedPages.size === 0) {
      console.log("Please select a PDF file and at least one page for extraction.");
      return;
    }

    const doc = new jsPDF();

    const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      if (selectedPages.has(i)) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        const canvasContext = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext,
          viewport,
        };

        await page.render(renderContext).promise;

        const imgData = canvas.toDataURL("image/jpeg");

        if (i !== 1) {
          doc.addPage();
        }
        doc.addImage(imgData, "JPEG", 10, 10, 190, 277);
      }
    }

    if (doc.internal.getNumberOfPages() === 0) {
      console.log("No selected pages to extract.");
      return;
    }

    doc.save("extracted.pdf");
  }

  return (
    <div className="App">
      <div className="container">
        <h1 className="heading">PDF Page Selection</h1>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        {pdfFile && (
          <div>
            <h2>Select Pages</h2>
            
            {[...Array(numPages).keys()].map((page) => (
              <label key={page + 1}>
                <input
                  type="checkbox"
                  value={page + 1}
                  checked={selectedPages.has(page + 1)}
                  onChange={handleCheckboxChange}
                />
                Page {page + 1}
              </label>
            ))}
            <button onClick={extractPDFnew}>Extract PDF</button>
          </div>
        )}
        
        <div className="pdf-preview">
          {pdfFile && (
            <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
              {[...Array(numPages).keys()].map((page) => (
                <Page key={page + 1} pageNumber={page + 1} width={300} />
              ))}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractPdf;
