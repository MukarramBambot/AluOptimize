"""
PDF Report Generator for AluOptimize
Uses ReportLab to generate branded PDF reports
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, PageBreak, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas


class AluOptimizePDFReport:
    """Generate branded PDF reports for AluOptimize"""
    
    def __init__(self):
        self.buffer = BytesIO()
        self.pagesize = letter
        self.width, self.height = self.pagesize
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#424242'),
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        
        # Section header
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=10,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        ))
    
    def _header_footer(self, canvas, doc):
        """Add header and footer to each page"""
        canvas.saveState()
        
        # Header
        canvas.setFillColor(colors.HexColor('#1976d2'))
        canvas.rect(0, self.height - 0.75*inch, self.width, 0.75*inch, fill=True, stroke=False)
        
        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 16)
        canvas.drawString(inch, self.height - 0.5*inch, "AluOptimize")
        
        canvas.setFont('Helvetica', 10)
        canvas.drawRightString(self.width - inch, self.height - 0.5*inch, 
                              f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        
        # Footer
        canvas.setFillColor(colors.grey)
        canvas.setFont('Helvetica', 8)
        canvas.drawCentredString(self.width/2, 0.5*inch, 
                                f"Page {doc.page} | AluOptimize - Aluminum Production Optimization System")
        canvas.drawCentredString(self.width/2, 0.3*inch, 
                                "© 2025 AluOptimize. All rights reserved.")
        
        canvas.restoreState()
    
    def generate_users_report(self, users_data):
        """Generate users report PDF"""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []
        
        # Title
        story.append(Paragraph("Users Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Summary
        total_users = len(users_data)
        active_users = sum(1 for u in users_data if u.get('is_active'))
        staff_users = sum(1 for u in users_data if u.get('is_staff'))
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Users', str(total_users)],
            ['Active Users', str(active_users)],
            ['Staff/Admin Users', str(staff_users)],
            ['Pending Approval', str(total_users - active_users)],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        story.append(Paragraph("Summary", self.styles['SectionHeader']))
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))
        
        # User list table
        story.append(Paragraph("User Details", self.styles['SectionHeader']))
        
        user_data = [['Username', 'Email', 'Status', 'Role', 'Joined']]
        for user in users_data:
            # Handle date_joined - could be datetime object or string
            date_joined = user.get('date_joined')
            if date_joined:
                if isinstance(date_joined, str):
                    date_joined = datetime.fromisoformat(date_joined).strftime('%Y-%m-%d')
                else:
                    date_joined = date_joined.strftime('%Y-%m-%d')
            else:
                date_joined = 'N/A'
            
            user_data.append([
                user.get('username', 'N/A'),
                user.get('email', 'N/A'),
                'Active' if user.get('is_active') else 'Pending',
                'Staff' if user.get('is_staff') else 'User',
                date_joined
            ])
        
        user_table = Table(user_data, colWidths=[1.3*inch, 2*inch, 0.8*inch, 0.8*inch, 1.1*inch])
        user_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(user_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        
        self.buffer.seek(0)
        return self.buffer
    
    def generate_predictions_report(self, predictions_data):
        """Generate predictions report PDF"""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []
        
        # Title
        story.append(Paragraph("Predictions Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Summary
        total_predictions = len(predictions_data)
        approved = sum(1 for p in predictions_data if p.get('is_approved'))
        avg_efficiency = sum(p.get('energy_efficiency', 0) for p in predictions_data) / total_predictions if total_predictions > 0 else 0
        avg_output = sum(p.get('predicted_output', 0) for p in predictions_data) / total_predictions if total_predictions > 0 else 0
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Predictions', str(total_predictions)],
            ['Approved Predictions', str(approved)],
            ['Average Efficiency', f"{avg_efficiency:.2f}%"],
            ['Average Output', f"{avg_output:.2f} kg"],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        story.append(Paragraph("Summary", self.styles['SectionHeader']))
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Predictions table
        story.append(Paragraph("Prediction Details", self.styles['SectionHeader']))
        
        pred_data = [['ID', 'Line', 'User', 'Output (kg)', 'Efficiency (%)', 'Status']]
        for pred in predictions_data[:50]:  # Limit to 50 for PDF
            pred_data.append([
                str(pred.get('id', 'N/A')),
                pred.get('input_data', {}).get('production_line', 'N/A')[:10],
                pred.get('input_data', {}).get('submitted_by', {}).get('username', 'N/A')[:15],
                f"{pred.get('predicted_output', 0):.2f}" if pred.get('predicted_output') else 'N/A',
                f"{pred.get('energy_efficiency', 0):.2f}" if pred.get('energy_efficiency') else 'N/A',
                pred.get('status', 'N/A')[:10]
            ])
        
        pred_table = Table(pred_data, colWidths=[0.5*inch, 1*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1*inch])
        pred_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(pred_table)
        
        if len(predictions_data) > 50:
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph(
                f"<i>Note: Showing first 50 of {len(predictions_data)} predictions. Download CSV for complete data.</i>",
                self.styles['Normal']
            ))
        
        # Build PDF
        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        
        self.buffer.seek(0)
        return self.buffer
    
    def generate_waste_report(self, waste_data, recommendations_data):
        """Generate waste management and recommendations report PDF"""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []
        
        # Title
        story.append(Paragraph("Waste Management Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Waste Summary
        total_waste = sum(w.get('waste_amount', 0) for w in waste_data)
        reusable_waste = sum(w.get('waste_amount', 0) for w in waste_data if w.get('reuse_possible'))
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Waste Records', str(len(waste_data))],
            ['Total Waste Amount', f"{total_waste:.2f} kg"],
            ['Reusable Waste', f"{reusable_waste:.2f} kg"],
            ['AI Recommendations', str(len(recommendations_data))],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        story.append(Paragraph("Summary", self.styles['SectionHeader']))
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Waste table
        story.append(Paragraph("Waste Records", self.styles['SectionHeader']))
        
        waste_table_data = [['Type', 'Amount', 'Line', 'Reusable', 'Date']]
        for waste in waste_data[:30]:
            # Handle date_recorded - could be date object or string
            date_recorded = waste.get('date_recorded')
            if date_recorded:
                if isinstance(date_recorded, str):
                    date_recorded = date_recorded[:10]
                else:
                    date_recorded = date_recorded.strftime('%Y-%m-%d')
            else:
                date_recorded = 'N/A'
            
            waste_table_data.append([
                waste.get('waste_type', 'N/A')[:20],
                f"{waste.get('waste_amount', 0):.2f} {waste.get('unit', 'kg')}",
                waste.get('production_line', 'N/A')[:10],
                'Yes' if waste.get('reuse_possible') else 'No',
                date_recorded
            ])
        
        waste_table = Table(waste_table_data, colWidths=[1.5*inch, 1.2*inch, 1*inch, 0.8*inch, 1.5*inch])
        waste_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(waste_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        
        self.buffer.seek(0)
        return self.buffer
