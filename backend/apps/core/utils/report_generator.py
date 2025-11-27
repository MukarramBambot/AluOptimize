import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.utils import timezone
from datetime import datetime

class ReportGenerator:
    """
    Utility class to generate PDF reports for AluOptimize
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_styles()
        
    def setup_styles(self):
        """Define custom styles for the report"""
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            alignment=TA_CENTER,
            spaceAfter=20,
            textColor=colors.HexColor('#1976d2')
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceBefore=15,
            spaceAfter=10,
            textColor=colors.HexColor('#1976d2'),
            borderPadding=(0, 0, 5, 0),
            borderWidth=1,
            borderColor=colors.HexColor('#e0e0e0'),
            borderRadius=None
        ))
        
        self.styles.add(ParagraphStyle(
            name='InfoLabel',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.gray,
            spaceAfter=2
        ))
        
        self.styles.add(ParagraphStyle(
            name='InfoValue',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.black,
            spaceAfter=8
        ))
        
        self.styles.add(ParagraphStyle(
            name='RecommendationText',
            parent=self.styles['Normal'],
            fontSize=11,
            leading=14,
            spaceAfter=10,
            textColor=colors.HexColor('#2e7d32')
        ))

    def generate_input_report(self, input_obj, output_obj, waste_obj, recommendations):
        """
        Generate a PDF report for a specific production input
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        story = []
        
        # --- Header ---
        story.append(Paragraph("AluOptimize Production Report", self.styles['ReportTitle']))
        story.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}", self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # --- User Information ---
        story.append(Paragraph("User Information", self.styles['SectionHeader']))
        
        user_data = [
            [Paragraph("<b>Username:</b>", self.styles['Normal']), input_obj.created_by.username],
            [Paragraph("<b>Email:</b>", self.styles['Normal']), input_obj.created_by.email],
            [Paragraph("<b>Role:</b>", self.styles['Normal']), input_obj.created_by.profile.role.capitalize() if hasattr(input_obj.created_by, 'profile') else 'User']
        ]
        
        t_user = Table(user_data, colWidths=[1.5*inch, 4*inch])
        t_user.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
        ]))
        story.append(t_user)
        story.append(Spacer(1, 15))
        
        # --- Production Input Details ---
        story.append(Paragraph("Production Input Parameters", self.styles['SectionHeader']))
        
        input_data = [
            ["Parameter", "Value", "Unit"],
            ["Production Line", input_obj.production_line, "-"],
            ["Feed Rate", str(input_obj.feed_rate), "kg/h"],
            ["Temperature", str(input_obj.temperature), "°C"],
            ["Pressure", str(input_obj.pressure), "kPa"],
            ["Power Consumption", str(input_obj.power_consumption), "kWh"],
            ["Bath Ratio", str(input_obj.bath_ratio), "-"],
            ["Alumina Conc.", str(input_obj.alumina_concentration), "%"],
            ["Anode Effect", str(input_obj.anode_effect), "s/day"],
        ]
        
        t_input = Table(input_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
        t_input.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f5f5f5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1976d2')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ]))
        story.append(t_input)
        story.append(Spacer(1, 15))
        
        # --- Prediction Results ---
        if output_obj:
            story.append(Paragraph("Prediction Results", self.styles['SectionHeader']))
            
            # Determine status color
            status_color = colors.green if output_obj.is_approved else colors.orange
            
            output_data = [
                ["Metric", "Value"],
                ["Predicted Output", f"{output_obj.predicted_output} kg"],
                ["Energy Efficiency", f"{output_obj.energy_efficiency}%"],
                ["Output Quality", f"{output_obj.output_quality}%"],
                ["Status", output_obj.status],
                ["Processed By", output_obj.processed_by.username if output_obj.processed_by else "System"],
            ]
            
            t_output = Table(output_data, colWidths=[2.5*inch, 3*inch])
            t_output.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e3f2fd')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0d47a1')),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ]))
            story.append(t_output)
            story.append(Spacer(1, 15))
        
        # --- Waste Management ---
        if waste_obj:
            story.append(Paragraph("Waste Management", self.styles['SectionHeader']))
            
            waste_data = [
                ["Metric", "Value"],
                ["Waste Type", waste_obj.waste_type],
                ["Waste Amount", f"{waste_obj.waste_amount} {waste_obj.unit}"],
                ["Reuse Possible", "Yes" if waste_obj.reuse_possible else "No"],
                ["Date Recorded", str(waste_obj.date_recorded)],
            ]
            
            t_waste = Table(waste_data, colWidths=[2.5*inch, 3*inch])
            t_waste.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#fff3e0')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#e65100')),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ]))
            story.append(t_waste)
            story.append(Spacer(1, 15))
            
        # --- Recommendations ---
        if recommendations:
            story.append(Paragraph("AI Recommendations", self.styles['SectionHeader']))
            
            for rec in recommendations:
                # Recommendation Box
                rec_content = [
                    [Paragraph(f"<b>Recommendation:</b> {rec.recommendation_text}", self.styles['RecommendationText'])],
                    [Paragraph(f"<b>Estimated Savings:</b> ${rec.estimated_savings}", self.styles['Normal'])],
                    [Paragraph(f"<i>AI Generated: {'Yes' if rec.ai_generated else 'No'}</i>", self.styles['InfoLabel'])]
                ]
                
                t_rec = Table(rec_content, colWidths=[5.5*inch])
                t_rec.setStyle(TableStyle([
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#c8e6c9')),
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f8e9')),
                    ('TOPPADDING', (0,0), (-1,-1), 10),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ]))
                story.append(t_rec)
                story.append(Spacer(1, 10))
        
        # --- Footer ---
        story.append(Spacer(1, 30))
        story.append(Paragraph("Generated by AluOptimize AI System", self.styles['InfoLabel']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
