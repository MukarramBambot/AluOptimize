"""
Input-Specific PDF Report Generator for AluOptimize
Generates detailed PDF reports for individual prediction inputs
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas


class InputReportPDFGenerator:
    """Generate detailed PDF reports for specific prediction inputs"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for the report"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=10,
            spaceBefore=15,
            fontName='Helvetica-Bold'
        ))
        
        # Subsection style
        self.styles.add(ParagraphStyle(
            name='SubSection',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#424242'),
            spaceAfter=8,
            fontName='Helvetica-Bold'
        ))
    
    def _header_footer(self, canvas, doc):
        """Add header and footer to each page"""
        canvas.saveState()
        width, height = letter
        
        # Header
        canvas.setFillColor(colors.HexColor('#1976d2'))
        canvas.rect(0, height - 0.75*inch, width, 0.75*inch, fill=True)
        
        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 16)
        canvas.drawString(inch, height - 0.5*inch, "AluOptimize")
        
        canvas.setFont('Helvetica', 10)
        canvas.drawRightString(width - inch, height - 0.5*inch, 
                              f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        
        # Footer
        canvas.setFillColor(colors.HexColor('#666666'))
        canvas.setFont('Helvetica', 9)
        canvas.drawCentredString(width/2, 0.5*inch, 
                                f"Page {doc.page} | AluOptimize - Detailed Production Report")
        canvas.drawCentredString(width/2, 0.3*inch, 
                                "© 2025 AluOptimize. All rights reserved.")
        
        canvas.restoreState()
    
    def generate_input_report(self, user_data, input_data, output_data=None, 
                             waste_data=None, recommendation_data=None):
        """
        Generate a detailed PDF report for a specific prediction input
        
        Args:
            user_data: dict with user information
            input_data: dict with prediction input parameters
            output_data: dict with prediction output results (optional)
            waste_data: dict with waste management data (optional)
            recommendation_data: dict with AI recommendations (optional)
        
        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []
        
        # Title
        story.append(Paragraph("Detailed Production Report", self.styles['ReportTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # User Information Section
        story.append(Paragraph("User Information", self.styles['SectionHeader']))
        
        user_info_data = [
            ['Field', 'Value'],
            ['Username', user_data.get('username', 'N/A')],
            ['Email', user_data.get('email', 'N/A')],
            ['User ID', str(user_data.get('id', 'N/A'))],
        ]
        
        user_table = Table(user_info_data, colWidths=[2*inch, 4*inch])
        user_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(user_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Input Parameters Section
        story.append(Paragraph("Input Parameters", self.styles['SectionHeader']))
        
        # Format date
        created_at = input_data.get('created_at', '')
        if created_at:
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at).strftime('%Y-%m-%d %H:%M:%S')
                except:
                    pass
            else:
                created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
        
        input_params_data = [
            ['Parameter', 'Value'],
            ['Input ID', str(input_data.get('id', 'N/A'))],
            ['Production Line', input_data.get('production_line', 'N/A')],
            ['Date Submitted', created_at or 'N/A'],
            ['Feed Rate', f"{input_data.get('feed_rate', 0)} kg/h"],
            ['Temperature', f"{input_data.get('temperature', 0)} °C"],
            ['Pressure', f"{input_data.get('pressure', 0)} Pa"],
            ['Power Consumption', f"{input_data.get('power_consumption', 0)} kWh"],
            ['Bath Ratio', str(input_data.get('bath_ratio', 'N/A'))],
            ['Alumina Concentration', str(input_data.get('alumina_concentration', 'N/A'))],
            ['Anode Effect', str(input_data.get('anode_effect', 'N/A'))],
        ]
        
        input_table = Table(input_params_data, colWidths=[2.5*inch, 3.5*inch])
        input_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(input_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Prediction Results Section
        if output_data:
            story.append(Paragraph("Prediction Results", self.styles['SectionHeader']))
            
            output_results_data = [
                ['Metric', 'Value'],
                ['Predicted Output', f"{output_data.get('predicted_output', 0):.2f} kg"],
                ['Energy Efficiency', f"{output_data.get('energy_efficiency', 0):.2f}%"],
                ['Output Quality', f"{output_data.get('output_quality', 0):.2f}"],
                ['Waste Estimate', f"{output_data.get('waste_estimate', 0):.2f} kg"],
                ['Status', output_data.get('status', 'N/A')],
                ['Approved', 'Yes' if output_data.get('is_approved') else 'No'],
                ['RL Reward', f"{output_data.get('reward', 0):.4f}" if output_data.get('reward') else 'N/A'],
            ]
            
            output_table = Table(output_results_data, colWidths=[2.5*inch, 3.5*inch])
            output_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(output_table)
            story.append(Spacer(1, 0.3*inch))
        
        # Waste Management Section
        if waste_data:
            story.append(Paragraph("Waste Management", self.styles['SectionHeader']))
            
            # Format waste date
            waste_date = waste_data.get('date_recorded', '')
            if waste_date:
                if isinstance(waste_date, str):
                    waste_date = waste_date[:10]
                else:
                    waste_date = waste_date.strftime('%Y-%m-%d')
            
            waste_info_data = [
                ['Field', 'Value'],
                ['Waste Type', waste_data.get('waste_type', 'N/A')],
                ['Waste Amount', f"{waste_data.get('waste_amount', 0):.2f} {waste_data.get('unit', 'kg')}"],
                ['Production Line', waste_data.get('production_line', 'N/A')],
                ['Reuse Possible', 'Yes' if waste_data.get('reuse_possible') else 'No'],
                ['Date Recorded', waste_date or 'N/A'],
            ]
            
            waste_table = Table(waste_info_data, colWidths=[2.5*inch, 3.5*inch])
            waste_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(waste_table)
            story.append(Spacer(1, 0.3*inch))
        
        # AI Recommendations Section
        if recommendation_data:
            story.append(Paragraph("AI Recommendations", self.styles['SectionHeader']))
            
            rec_text = recommendation_data.get('recommendation_text', 'No recommendations available.')
            estimated_savings = recommendation_data.get('estimated_savings', 0)
            ai_generated = recommendation_data.get('ai_generated', False)
            
            # Recommendation details table
            rec_info_data = [
                ['Field', 'Value'],
                ['AI Generated', 'Yes' if ai_generated else 'No'],
                ['Estimated Savings', f"${estimated_savings:.2f}" if estimated_savings else 'N/A'],
            ]
            
            rec_table = Table(rec_info_data, colWidths=[2.5*inch, 3.5*inch])
            rec_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(rec_table)
            story.append(Spacer(1, 0.15*inch))
            
            # Recommendation text
            story.append(Paragraph("Recommendation Details:", self.styles['SubSection']))
            rec_paragraph = Paragraph(rec_text, self.styles['Normal'])
            story.append(rec_paragraph)
            story.append(Spacer(1, 0.2*inch))
        
        # Performance Summary Section
        if output_data:
            story.append(Paragraph("Performance Summary", self.styles['SectionHeader']))
            
            efficiency = output_data.get('energy_efficiency', 0)
            quality = output_data.get('output_quality', 0)
            
            # Determine performance rating
            if efficiency >= 80 and quality >= 80:
                rating = "Excellent"
                rating_color = colors.green
            elif efficiency >= 60 and quality >= 60:
                rating = "Good"
                rating_color = colors.blue
            elif efficiency >= 40 and quality >= 40:
                rating = "Fair"
                rating_color = colors.orange
            else:
                rating = "Needs Improvement"
                rating_color = colors.red
            
            summary_data = [
                ['Metric', 'Score', 'Rating'],
                ['Energy Efficiency', f"{efficiency:.2f}%", rating],
                ['Output Quality', f"{quality:.2f}", rating],
            ]
            
            summary_table = Table(summary_data, colWidths=[2*inch, 2*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('TEXTCOLOR', (2, 1), (2, -1), rating_color),
                ('FONTNAME', (2, 1), (2, -1), 'Helvetica-Bold'),
            ]))
            
            story.append(summary_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        
        buffer.seek(0)
        return buffer
