import React, { Component } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { jsPDF } from "jspdf";
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

class App extends Component {
  state = {
    numPages: null,
    selectedPages: new Set(),
    pdfFile: null,
    pdfData: null,
  };

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ numPages });
  };

  handleFileChange = (event) => {
    const pdfFile = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      this.setState({
        pdfFile,
        numPages: null,
        pdfData: e.target.result,
      });
    };

    reader.readAsArrayBuffer(pdfFile);
  };

  handleCheckboxChange = (event) => {
    const page = parseInt(event.target.value, 10);
    const { selectedPages } = this.state;

    if (event.target.checked) {
      selectedPages.add(page);
    } else {
      selectedPages.delete(page);
    }

    this.setState({ selectedPages });
  };

  async extractPDF() {
    const { selectedPages, pdfData } = this.state;

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

  render() {
    const { numPages, selectedPages, pdfFile } = this.state;

    return (
      <div className="App">
        <div className="container">
        <h1 className="heading">PDF Page Selection</h1>
        <input type="file" accept=".pdf" onChange={this.handleFileChange} />
        {pdfFile && (
          <div>
            <h2>Select Pages</h2>
            {[...Array(numPages).keys()].map((page) => (
              <label key={page + 1}>
                <input
                  type="checkbox"
                  value={page + 1}
                  checked={selectedPages.has(page + 1)}
                  onChange={this.handleCheckboxChange}
                />
                Page {page + 1}
              </label>
            ))}
            <button onClick={this.extractPDF.bind(this)}>Extract PDF</button>
          </div>
        )}
        <div className="pdf-preview">
          {pdfFile && (
            <Document file={pdfFile} onLoadSuccess={this.onDocumentLoadSuccess}>
              {[...Array(numPages).keys()].map((page) => (
                <Page key={page + 1} pageNumber={page + 1} width={300} />
              ))}
            </Document>
          )}
        </div>
      </div>
      </div>
    );
  }
}

export default App;
