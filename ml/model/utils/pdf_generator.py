from fpdf import FPDF
import os
from datetime import datetime
import sys
import uuid

class PDF(FPDF):
    def header(self):
        # Logo
        # self.image('logo.png', 10, 8, 33)
        # Arial bold 15
        self.set_font('Arial', 'B', 15)
        # Move to the right
        self.cell(80)
        # Title
        self.cell(30, 10, 'Speech Emotion Analysis Report', 0, 0, 'C')
        # Line break
        self.ln(20)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('Arial', 'I', 8)
        # Page number
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

    def chapter_title(self, title):
        # Arial 12
        self.set_font('Arial', 'B', 12)
        # Background color
        self.set_fill_color(200, 220, 255)
        # Title
        self.cell(0, 6, title, 0, 1, 'L', 1)
        # Line break
        self.ln(4)

    def chapter_body(self, body):
        # Times 12
        self.set_font('Arial', '', 12)
        # Output justified text
        self.multi_cell(0, 5, body)
        # Line break
        self.ln()

def generate_pdf(report_data, pdf_path=None):
    """Generate a PDF report with the analysis results."""
    try:
        print(f"Starting PDF generation for path: {pdf_path}", file=sys.stderr)
        
        # Always use the correct directory
        pdf_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "server", "uploads", "reports")
        os.makedirs(pdf_dir, exist_ok=True)
        if not pdf_path:
            # Use a unique name if not provided
            pdf_path = os.path.join(pdf_dir, f"report-{uuid.uuid4().hex}.pdf")
        elif not os.path.isabs(pdf_path):
            pdf_path = os.path.join(pdf_dir, pdf_path)
        
        # Create PDF object
        pdf = PDF()
        pdf.alias_nb_pages()
        pdf.add_page()
        
        # Add date
        pdf.set_font('Arial', 'I', 10)
        pdf.cell(0, 10, f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1)
        pdf.ln(10)

        # Add patient information
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 10, f"Name: {report_data.get('patientName', 'N/A')}")
        pdf.ln()
        pdf.cell(0, 10, f"Age: {report_data.get('patientAge', 'N/A')}")
        pdf.ln()
        pdf.cell(0, 10, f"Gender: {report_data.get('patientGender', 'N/A')}")
        pdf.ln()
        pdf.cell(0, 10, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        pdf.ln(10)

        # Add transcript section
        pdf.chapter_title('Transcription')
        transcript = report_data.get('transcript', 'No transcript available')
        print(f"Adding transcript: {transcript[:100]}...", file=sys.stderr)
        pdf.chapter_body(transcript)

        # Add emotions section
        pdf.chapter_title('Detected Emotions')
        emotions = report_data.get('emotions', [])
        print(f"Adding emotions: {emotions}", file=sys.stderr)
        if emotions:
            pdf.chapter_body(', '.join(emotions))
        else:
            pdf.chapter_body('No emotions detected')

        # Add analysis section
        pdf.chapter_title('Analysis')
        analysis = f"""
        Average Pitch: {report_data.get('pitch', 0)} Hz
        Silence Duration: {report_data.get('silence', 0)} seconds
        Speaking Pace: {report_data.get('pace', 0)} words per minute
        """
        print(f"Adding analysis: {analysis}", file=sys.stderr)
        pdf.chapter_body(analysis)

        # Add summary section
        pdf.chapter_title('Summary')
        summary = report_data.get('summary', 'No summary available')
        print(f"Adding summary: {summary[:100]}...", file=sys.stderr)
        pdf.chapter_body(summary)

        # Ensure directory exists
        if pdf_dir:
            print(f"Creating PDF directory: {pdf_dir}", file=sys.stderr)
            os.makedirs(pdf_dir, exist_ok=True)
            # Check if directory is writable
            if not os.access(pdf_dir, os.W_OK):
                print(f"Error: Directory {pdf_dir} is not writable", file=sys.stderr)
                return False
        
        # Save PDF
        print(f"Saving PDF to: {pdf_path}", file=sys.stderr)
        pdf.output(pdf_path)
        
        # Verify PDF was created
        if os.path.exists(pdf_path):
            print(f"PDF successfully created at: {pdf_path}", file=sys.stderr)
            return True
        else:
            print(f"Error: PDF file was not created at {pdf_path}", file=sys.stderr)
            return False
            
    except Exception as e:
        print(f"Error generating PDF: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False
