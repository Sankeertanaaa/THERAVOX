try:
    from fpdf import FPDF
    print('FPDF imported successfully')
except ImportError as e:
    print(f'Error importing FPDF: {e}')

from ml.model.utils.pdf_generator import generate_pdf

# Test data
test_data = {
    'transcript': 'Test transcript',
    'emotions': ['happy'],
    'pitch': 100,
    'pace': 120,
    'silence': 1,
    'summary': 'Test summary'
}

# Generate PDF
result = generate_pdf(test_data, 'test.pdf')
print(f'PDF generation result: {result}') 