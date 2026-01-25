'use client';

import { useState } from 'react';
import { FileDown, Loader2, Lock, Crown } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';

interface ReportData {
  store: { domain: string; plan: string };
  analysis: {
    themeName: string;
    overallScore: number;
    totalSections: number;
    analyzedAt: string;
  };
  sections: Array<{
    name: string;
    type: string;
    score: number;
    recommendations: string[];
  }>;
  summary: {
    critical: number;
    warning: number;
    good: number;
    totalRecommendations: number;
  };
  agency?: {
    name: string;
    logoBase64?: string | null;
    logoUrl?: string | null;
    primaryColor?: string;
  } | null;
  generatedAt: string;
}

interface PDFReportButtonProps {
  shop: string;
}

export function PDFReportButton({ shop }: PDFReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { canUsePdfReport, features } = usePlan();
  const pdfAllowed = canUsePdfReport().allowed;
  const isWhiteLabel = features.pdfWhiteLabel; // Pro+ gets white label

  const generatePDF = async () => {
    // Check plan permission
    if (!pdfAllowed) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/report?shop=${shop}`);
      if (!response.ok) throw new Error('Failed to fetch report data');
      
      const data: ReportData = await response.json();
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = 0;

      // Color definitions
      const colors = {
        primary: [99, 102, 241] as [number, number, number],      // Indigo
        primaryDark: [79, 70, 229] as [number, number, number],   // Darker indigo
        success: [16, 185, 129] as [number, number, number],      // Emerald
        warning: [245, 158, 11] as [number, number, number],      // Amber
        danger: [239, 68, 68] as [number, number, number],        // Red
        dark: [15, 23, 42] as [number, number, number],           // Slate 900
        text: [51, 65, 85] as [number, number, number],           // Slate 600
        textLight: [100, 116, 139] as [number, number, number],   // Slate 500
        bgLight: [248, 250, 252] as [number, number, number],     // Slate 50
        white: [255, 255, 255] as [number, number, number],
      };

      // Helper to convert hex color to RGB
      const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result 
          ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
          : colors.primary;
      };

      const getScoreColor = (score: number): [number, number, number] => {
        if (score >= 70) return colors.success;
        if (score >= 50) return colors.warning;
        return colors.danger;
      };

      const getStatusText = (score: number): string => {
        if (score >= 70) return 'Optimal';
        if (score >= 50) return 'Warnung';
        return 'Kritisch';
      };

      const storeName = data.store.domain.replace('.myshopify.com', '');
      const dateStr = new Date(data.generatedAt).toLocaleDateString('de-DE', { 
        day: '2-digit', month: 'long', year: 'numeric' 
      });

      // Helper for page footer
      const addPageFooter = (pageNum: number, totalPages: number) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...colors.textLight);
        
        if (!isWhiteLabel) {
          // Show ThemeMetrics branding for Free/Starter
          doc.setFont('helvetica', 'bold');
          doc.text('ThemeMetrics', margin, pageHeight - 8);
          doc.setFont('helvetica', 'normal');
          doc.text('Confidential Report', pageWidth / 2, pageHeight - 8, { align: 'center' });
        } else if (data.agency?.name) {
          // Agency branding for Agency plan
          doc.setFont('helvetica', 'bold');
          doc.text(data.agency.name, margin, pageHeight - 8);
          doc.setFont('helvetica', 'normal');
          doc.text('Confidential Report', pageWidth / 2, pageHeight - 8, { align: 'center' });
        } else {
          // White-label for Pro+: just show store name
          doc.setFont('helvetica', 'normal');
          doc.text(`${storeName} - Confidential`, margin, pageHeight - 8);
        }
        
        doc.text(`Seite ${pageNum} von ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      };

      // ==========================================
      // PAGE 1: Executive Summary
      // ==========================================
      
      // Get agency branding if available
      const agencyBranding = data.agency;
      const headerColor = agencyBranding?.primaryColor 
        ? hexToRgb(agencyBranding.primaryColor) 
        : colors.primary;
      
      // Header with gradient effect (solid color in PDF)
      doc.setFillColor(...headerColor);
      doc.rect(0, 0, pageWidth, 55, 'F');
      
      if (!isWhiteLabel) {
        // ThemeMetrics branding for Free/Starter
        // Logo area
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 8, 20, 8, 'F');
        doc.setFillColor(...headerColor);
        doc.circle(margin + 8, 20, 5, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 8, 20, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ThemeMetrics', margin + 22, 23);
      } else if (agencyBranding?.logoBase64) {
        // Agency custom logo for Agency plan
        try {
          const logoData = agencyBranding.logoBase64;
          // Add logo image (PNG/JPG)
          doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(agencyBranding.name || 'Performance Report', margin + 35, 23);
        } catch (e) {
          // Fallback if logo fails
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text(agencyBranding.name || 'Performance Report', margin, 23);
        }
      } else {
        // White-label for Pro+ without custom logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(agencyBranding?.name || 'Performance Report', margin, 23);
      }
      
      // Report type badge
      doc.setFillColor(255, 255, 255, 0.2);
      doc.roundedRect(pageWidth - margin - 45, 13, 45, 14, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text('Performance Report', pageWidth - margin - 40, 22);
      
      // Store info below header
      doc.setFontSize(11);
      doc.text(storeName, margin, 42);
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 255);
      doc.text(`Theme: ${data.analysis.themeName}  •  ${dateStr}`, margin, 50);
      
      y = 70;

      // Main Score Section
      doc.setTextColor(...colors.dark);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('GESAMTBEWERTUNG', margin, y);
      
      y += 10;
      
      // Score circle area
      const scoreBoxY = y;
      doc.setFillColor(...colors.bgLight);
      doc.roundedRect(margin, y, 70, 55, 5, 5, 'F');
      
      // Big score number
      const scoreColor = getScoreColor(data.analysis.overallScore);
      doc.setFontSize(42);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...scoreColor);
      doc.text(data.analysis.overallScore.toString(), margin + 35, y + 35, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(...colors.textLight);
      doc.text('von 100 Punkten', margin + 35, y + 48, { align: 'center' });
      
      // Stats cards next to score
      const statsX = margin + 80;
      const cardWidth = (pageWidth - statsX - margin - 10) / 3;
      
      // Critical card
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(statsX, y, cardWidth, 55, 4, 4, 'F');
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.danger);
      doc.text(data.summary.critical.toString(), statsX + cardWidth/2, y + 28, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(...colors.text);
      doc.text('Kritisch', statsX + cardWidth/2, y + 42, { align: 'center' });
      
      // Warning card
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(statsX + cardWidth + 5, y, cardWidth, 55, 4, 4, 'F');
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.warning);
      doc.text(data.summary.warning.toString(), statsX + cardWidth + 5 + cardWidth/2, y + 28, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(...colors.text);
      doc.text('Warnungen', statsX + cardWidth + 5 + cardWidth/2, y + 42, { align: 'center' });
      
      // Good card
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(statsX + 2*cardWidth + 10, y, cardWidth, 55, 4, 4, 'F');
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.success);
      doc.text(data.summary.good.toString(), statsX + 2*cardWidth + 10 + cardWidth/2, y + 28, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(...colors.text);
      doc.text('Optimal', statsX + 2*cardWidth + 10 + cardWidth/2, y + 42, { align: 'center' });
      
      y = scoreBoxY + 70;

      // Key Metrics Dark Box
      doc.setFillColor(...colors.dark);
      doc.roundedRect(margin, y, pageWidth - 2*margin, 35, 5, 5, 'F');
      
      const metricWidth = (pageWidth - 2*margin) / 3;
      doc.setTextColor(255, 255, 255);
      
      // Metric 1
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(data.analysis.totalSections.toString(), margin + metricWidth/2, y + 18, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text('Sections analysiert', margin + metricWidth/2, y + 28, { align: 'center' });
      
      // Metric 2
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(data.summary.totalRecommendations.toString(), margin + metricWidth + metricWidth/2, y + 18, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text('Empfehlungen', margin + metricWidth + metricWidth/2, y + 28, { align: 'center' });
      
      // Metric 3
      const avgScore = Math.round(data.sections.reduce((sum, s) => sum + s.score, 0) / data.sections.length);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${avgScore}%`, margin + 2*metricWidth + metricWidth/2, y + 18, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text('Durchschnitt', margin + 2*metricWidth + metricWidth/2, y + 28, { align: 'center' });
      
      y += 50;

      // Top Critical Sections
      const criticalSections = data.sections.filter(s => s.score < 50).slice(0, 3);
      if (criticalSections.length > 0) {
        doc.setTextColor(...colors.dark);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP KRITISCHE SECTIONS', margin, y);
        
        y += 8;
        
        criticalSections.forEach((section, idx) => {
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(margin, y, pageWidth - 2*margin, 22, 4, 4, 'F');
          
          // Number badge
          doc.setFillColor(...colors.danger);
          doc.circle(margin + 12, y + 11, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text((idx + 1).toString(), margin + 12, y + 14, { align: 'center' });
          
          // Section name
          doc.setTextColor(...colors.dark);
          doc.setFontSize(11);
          doc.text(section.name, margin + 28, y + 10);
          
          // Section type
          doc.setFontSize(8);
          doc.setTextColor(...colors.textLight);
          doc.text(section.type, margin + 28, y + 18);
          
          // Score
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.danger);
          doc.text(section.score.toString(), pageWidth - margin - 15, y + 14, { align: 'right' });
          
          y += 26;
        });
      }

      // ==========================================
      // PAGE 2: All Sections
      // ==========================================
      doc.addPage();
      y = 20;
      
      // Page 2 Header
      doc.setFillColor(...colors.bgLight);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(...colors.primary);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Section-Analyse', margin, 22);
      
      doc.setTextColor(...colors.textLight);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${data.analysis.totalSections} Sections analysiert`, pageWidth - margin, 22, { align: 'right' });
      
      y = 45;

      // Table header
      doc.setFillColor(...colors.dark);
      doc.roundedRect(margin, y, pageWidth - 2*margin, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION', margin + 5, y + 8);
      doc.text('TYP', margin + 55, y + 8);
      doc.text('SCORE', margin + 95, y + 8);
      doc.text('STATUS', pageWidth - margin - 5, y + 8, { align: 'right' });
      
      y += 16;

      // Table rows
      data.sections.forEach((section, idx) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
          // Repeat header on new page
          doc.setFillColor(...colors.dark);
          doc.roundedRect(margin, y, pageWidth - 2*margin, 12, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('SECTION', margin + 5, y + 8);
          doc.text('TYP', margin + 55, y + 8);
          doc.text('SCORE', margin + 95, y + 8);
          doc.text('STATUS', pageWidth - margin - 5, y + 8, { align: 'right' });
          y += 16;
        }
        
        // Alternating row background
        if (idx % 2 === 0) {
          doc.setFillColor(252, 252, 253);
          doc.rect(margin, y - 2, pageWidth - 2*margin, 14, 'F');
        }
        
        // Section name
        doc.setTextColor(...colors.dark);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(section.name.substring(0, 25), margin + 5, y + 6);
        
        // Type
        doc.setTextColor(...colors.textLight);
        doc.setFontSize(8);
        doc.text(section.type.substring(0, 15), margin + 55, y + 6);
        
        // Score bar background
        const barWidth = 30;
        const barX = margin + 95;
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(barX, y + 1, barWidth, 6, 2, 2, 'F');
        
        // Score bar fill
        const fillWidth = Math.max((section.score / 100) * barWidth, 2);
        const sColor = getScoreColor(section.score);
        doc.setFillColor(...sColor);
        doc.roundedRect(barX, y + 1, fillWidth, 6, 2, 2, 'F');
        
        // Score number after bar
        doc.setTextColor(...sColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(section.score.toString(), barX + barWidth + 8, y + 6);
        
        // Status text
        const statusText = getStatusText(section.score);
        doc.setTextColor(...sColor);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(statusText, pageWidth - margin - 5, y + 6, { align: 'right' });
        
        y += 14;
      });

      // ==========================================
      // PAGE 3: Recommendations
      // ==========================================
      doc.addPage();
      y = 20;
      
      // Page 3 Header
      doc.setFillColor(...colors.bgLight);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(...colors.primary);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Empfehlungen', margin, 22);
      
      doc.setTextColor(...colors.textLight);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Priorisiert nach Impact', pageWidth - margin, 22, { align: 'right' });
      
      y = 50;

      // Get all recommendations with section info
      const allRecs = data.sections
        .filter(s => s.recommendations && s.recommendations.length > 0)
        .flatMap(s => s.recommendations.map(rec => ({
          text: rec,
          section: s.name,
          type: s.type,
          score: s.score,
          impact: s.score < 50 ? 'High' : s.score < 70 ? 'Medium' : 'Low'
        })))
        .sort((a, b) => a.score - b.score)
        .slice(0, 8);

      allRecs.forEach((rec, idx) => {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }
        
        // Card background
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, pageWidth - 2*margin, 28, 4, 4, 'F');
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(margin, y, pageWidth - 2*margin, 28, 4, 4, 'S');
        
        // Number
        doc.setFillColor(...colors.primary);
        doc.circle(margin + 12, y + 14, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text((idx + 1).toString(), margin + 12, y + 17, { align: 'center' });
        
        // Recommendation text
        doc.setTextColor(...colors.dark);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(rec.text, pageWidth - 2*margin - 80);
        doc.text(lines[0], margin + 28, y + 12);
        if (lines[1]) {
          doc.text(lines[1].substring(0, 60) + (lines[1].length > 60 ? '...' : ''), margin + 28, y + 20);
        }
        
        // Tags
        const tagY = y + 22;
        
        // Section name tag (not type)
        const sectionTagWidth = Math.min(rec.section.length * 3 + 10, 50);
        doc.setFillColor(240, 240, 255);
        doc.roundedRect(margin + 28, tagY, sectionTagWidth, 8, 2, 2, 'F');
        doc.setTextColor(...colors.primary);
        doc.setFontSize(6);
        doc.text(rec.section.substring(0, 18), margin + 32, tagY + 5.5);
        
        // Impact tag
        const impactColor = rec.impact === 'High' ? colors.danger : rec.impact === 'Medium' ? colors.warning : colors.success;
        const impactBg = rec.impact === 'High' ? [254, 242, 242] : rec.impact === 'Medium' ? [255, 251, 235] : [236, 253, 245];
        doc.setFillColor(impactBg[0], impactBg[1], impactBg[2]);
        doc.roundedRect(margin + 32 + sectionTagWidth, tagY, 35, 8, 2, 2, 'F');
        doc.setTextColor(...impactColor);
        doc.text(`${rec.impact} Impact`, margin + 36 + sectionTagWidth, tagY + 5.5);
        
        y += 34;
      });

      // Next steps box
      y += 10;
      if (y < pageHeight - 50) {
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, y, pageWidth - 2*margin, 30, 4, 4, 'F');
        
        doc.setTextColor(...colors.primary);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Naechste Schritte', margin + 10, y + 12);
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Starte mit den High Impact Empfehlungen. Nach der Umsetzung kannst du eine neue', margin + 10, y + 20);
        doc.text('Analyse durchfuehren um die Verbesserungen zu messen.', margin + 10, y + 26);
      }

      // Add footers to all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageFooter(i, totalPages);
      }

      // Save PDF
      const filename = isWhiteLabel 
        ? `Performance-Report-${storeName}-${new Date().toISOString().split('T')[0]}.pdf`
        : `ThemeMetrics-Report-${storeName}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

    } catch (err) {
      console.error('PDF generation error:', err);
      setError('PDF konnte nicht erstellt werden');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {pdfAllowed ? (
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generiere Report...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Report herunterladen
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors shadow-sm group relative"
        >
          <FileDown className="w-4 h-4" />
          Report herunterladen
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ab Starter Plan verfügbar
          </span>
        </button>
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="PDF Reports"
        reason="PDF Reports zum Teilen und Archivieren sind ab dem Starter Plan verfügbar."
        recommendedPlan="starter"
        shop={shop}
      />
    </div>
  );
}
