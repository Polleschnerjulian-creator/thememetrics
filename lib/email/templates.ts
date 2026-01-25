// Email Templates for ThemeMetrics
// Using inline styles for maximum email client compatibility

const BRAND_COLOR = '#6366f1';
const BRAND_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';

// Base template wrapper
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ThemeMetrics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: ${BRAND_GRADIENT}; padding: 32px 40px; text-align: center;">
              <img src="https://thememetrics.de/logo-white.png" alt="ThemeMetrics" width="180" style="display: block; margin: 0 auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                      © 2026 ThemeMetrics. Alle Rechte vorbehalten.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      <a href="https://thememetrics.de/datenschutz" style="color: #9ca3af; text-decoration: underline;">Datenschutz</a>
                      &nbsp;·&nbsp;
                      <a href="https://thememetrics.de/impressum" style="color: #9ca3af; text-decoration: underline;">Impressum</a>
                      &nbsp;·&nbsp;
                      <a href="{{{unsubscribe_url}}}" style="color: #9ca3af; text-decoration: underline;">Abmelden</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Button component
function button(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
      <tr>
        <td style="background: ${BRAND_GRADIENT}; border-radius: 8px;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Score badge component
function scoreBadge(score: number): string {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return `
    <div style="display: inline-block; background-color: ${color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px;">
      Score: ${score}
    </div>
  `;
}

// ==========================================
// EMAIL TEMPLATES
// ==========================================

export interface WelcomeEmailData {
  storeName: string;
  dashboardUrl: string;
}

export function welcomeEmail(data: WelcomeEmailData): string {
  return baseTemplate(`
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: #18181b;">
      Willkommen bei ThemeMetrics! 🎉
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hey <strong>${data.storeName}</strong>,<br><br>
      Schön, dass du da bist! Du bist nur einen Klick von deiner ersten Theme-Analyse entfernt.
    </p>
    
    <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Mit ThemeMetrics findest du heraus:
    </p>
    
    <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #52525b;">
      <li>Welche Sections deine Ladezeit killen</li>
      <li>Wo du am schnellsten Performance gewinnst</li>
      <li>Wie du im Vergleich zur Konkurrenz stehst</li>
    </ul>
    
    ${button('Erste Analyse starten →', data.dashboardUrl)}
    
    <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
      Fragen? Antworte einfach auf diese Email – wir helfen gerne!
    </p>
  `);
}

export interface AnalysisCompleteEmailData {
  storeName: string;
  themeName: string;
  score: number;
  criticalCount: number;
  dashboardUrl: string;
}

export function analysisCompleteEmail(data: AnalysisCompleteEmailData): string {
  const scoreColor = data.score >= 80 ? '#10b981' : data.score >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = data.score >= 80 ? 'Sehr gut!' : data.score >= 60 ? 'Verbesserungspotenzial' : 'Dringender Handlungsbedarf';
  
  return baseTemplate(`
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: #18181b;">
      Deine Analyse ist fertig! 📊
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hey ${data.storeName}, wir haben <strong>${data.themeName}</strong> analysiert.
    </p>
    
    <!-- Score Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f9fafb; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
            Performance Score
          </p>
          <p style="margin: 0 0 8px 0; font-size: 48px; font-weight: bold; color: ${scoreColor};">
            ${data.score}
          </p>
          <p style="margin: 0; font-size: 16px; color: ${scoreColor}; font-weight: 500;">
            ${scoreLabel}
          </p>
        </td>
      </tr>
    </table>
    
    ${data.criticalCount > 0 ? `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        <strong>⚠️ ${data.criticalCount} kritische Section${data.criticalCount > 1 ? 's' : ''}</strong> gefunden, die deine Conversion beeinträchtigen könnten.
      </p>
    </div>
    ` : ''}
    
    ${button('Detaillierte Ergebnisse ansehen →', data.dashboardUrl)}
  `);
}

export interface WeeklyReportEmailData {
  storeName: string;
  currentScore: number;
  previousScore: number;
  topIssue?: string;
  dashboardUrl: string;
}

export function weeklyReportEmail(data: WeeklyReportEmailData): string {
  const scoreDiff = data.currentScore - data.previousScore;
  const scoreColor = data.currentScore >= 80 ? '#10b981' : data.currentScore >= 60 ? '#f59e0b' : '#ef4444';
  const trendIcon = scoreDiff > 0 ? '📈' : scoreDiff < 0 ? '📉' : '➡️';
  const trendText = scoreDiff > 0 ? `+${scoreDiff} Punkte` : scoreDiff < 0 ? `${scoreDiff} Punkte` : 'Unverändert';
  const trendColor = scoreDiff > 0 ? '#10b981' : scoreDiff < 0 ? '#ef4444' : '#6b7280';
  
  return baseTemplate(`
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: #18181b;">
      Dein Wochenreport ${trendIcon}
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hey ${data.storeName}, hier ist dein wöchentlicher Performance-Überblick.
    </p>
    
    <!-- Score Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f9fafb; border-radius: 12px; padding: 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="text-align: center; width: 50%; border-right: 1px solid #e5e7eb;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">
                  Aktueller Score
                </p>
                <p style="margin: 0; font-size: 36px; font-weight: bold; color: ${scoreColor};">
                  ${data.currentScore}
                </p>
              </td>
              <td style="text-align: center; width: 50%;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">
                  Veränderung
                </p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${trendColor};">
                  ${trendText}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${data.topIssue ? `
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">
        Top-Priorität diese Woche
      </p>
      <p style="margin: 0; font-size: 14px; color: #78350f;">
        ${data.topIssue}
      </p>
    </div>
    ` : ''}
    
    ${button('Vollständigen Report ansehen →', data.dashboardUrl)}
  `);
}

export interface ScoreAlertEmailData {
  storeName: string;
  oldScore: number;
  newScore: number;
  changeReason?: string;
  dashboardUrl: string;
}

export function scoreAlertEmail(data: ScoreAlertEmailData): string {
  const scoreDiff = data.newScore - data.oldScore;
  const isImprovement = scoreDiff > 0;
  const alertColor = isImprovement ? '#10b981' : '#ef4444';
  const alertBg = isImprovement ? '#ecfdf5' : '#fef2f2';
  const emoji = isImprovement ? '🎉' : '⚠️';
  
  return baseTemplate(`
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: #18181b;">
      Score-Änderung erkannt ${emoji}
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hey ${data.storeName}, dein Performance Score hat sich ${isImprovement ? 'verbessert' : 'verschlechtert'}.
    </p>
    
    <!-- Score Comparison -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: ${alertBg}; border-radius: 12px; padding: 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="text-align: center; width: 40%;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Vorher</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #6b7280;">${data.oldScore}</p>
              </td>
              <td style="text-align: center; width: 20%;">
                <p style="margin: 0; font-size: 24px; color: ${alertColor};">→</p>
              </td>
              <td style="text-align: center; width: 40%;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Nachher</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: ${alertColor};">${data.newScore}</p>
              </td>
            </tr>
          </table>
          <p style="margin: 16px 0 0 0; text-align: center; font-size: 18px; font-weight: 600; color: ${alertColor};">
            ${isImprovement ? '+' : ''}${scoreDiff} Punkte
          </p>
        </td>
      </tr>
    </table>
    
    ${data.changeReason ? `
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525b;">
      <strong>Mögliche Ursache:</strong> ${data.changeReason}
    </p>
    ` : ''}
    
    ${button('Details ansehen →', data.dashboardUrl)}
  `);
}

// Lead nurture emails
export interface LeadNurtureEmailData {
  email: string;
  shopUrl?: string;
  score?: number;
}

export function leadNurtureDay1(data: LeadNurtureEmailData): string {
  return baseTemplate(`
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: #18181b;">
      3 Theme-Fehler, die dich Umsatz kosten 💸
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hey! Danke für deinen Speed Check gestern.
      ${data.score ? `Dein Score von <strong>${data.score}</strong> zeigt Potenzial.` : ''}
    </p>
    
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hier sind die 3 häufigsten Theme-Probleme, die wir bei Shopify Stores sehen:
    </p>
    
    <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 16px; line-height: 2; color: #52525b;">
      <li><strong>Unoptimierte Hero-Sections</strong> – Oft 40%+ der Ladezeit</li>
      <li><strong>Zu viele Liquid Loops</strong> – Verlangsamt den Server</li>
      <li><strong>Fehlende Lazy Loading</strong> – Lädt alles auf einmal</li>
    </ol>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Mit ThemeMetrics siehst du <strong>genau welche Sections</strong> diese Probleme haben – und wie du sie fixst.
    </p>
    
    ${button('Kostenlos testen →', 'https://thememetrics.de/api/auth/install?shop=' + (data.shopUrl || ''))}
  `);
}

export function leadNurtureDay3(data: LeadNurtureEmailData): string {
  return baseTemplate(`
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: #18181b;">
      Wie ein Store seinen Score um 40 Punkte verbesserte 📈
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Letzte Woche hat ein Fashion Store mit ThemeMetrics seinen Performance Score von 45 auf 85 gebracht.
    </p>
    
    <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #18181b;">
      Was sie gemacht haben:
    </p>
    
    <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 16px; line-height: 2; color: #52525b;">
      <li>Hero-Video durch optimiertes Bild ersetzt (+15 Punkte)</li>
      <li>Lazy Loading für Collection Grid aktiviert (+12 Punkte)</li>
      <li>Unnötige Apps aus dem Theme entfernt (+8 Punkte)</li>
      <li>Featured Products Section vereinfacht (+5 Punkte)</li>
    </ul>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>Das Ergebnis:</strong> 23% höhere Conversion Rate im ersten Monat.
    </p>
    
    ${button('Deine Sections analysieren →', 'https://thememetrics.de/api/auth/install?shop=' + (data.shopUrl || ''))}
  `);
}

export function leadNurtureDay7(data: LeadNurtureEmailData): string {
  return baseTemplate(`
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: #18181b;">
      Exklusiv: 20% Rabatt auf den Starter Plan 🎁
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hey! Da du dich für Performance interessierst, hab ich was für dich:
    </p>
    
    <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase;">
        Dein Rabattcode
      </p>
      <p style="margin: 0 0 8px 0; font-size: 32px; font-weight: bold; color: #10b981; font-family: monospace;">
        SPEED20
      </p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        Gültig für 48 Stunden
      </p>
    </div>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Das bekommst du mit dem <strong>Starter Plan</strong>:
    </p>
    
    <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 16px; line-height: 2; color: #52525b;">
      <li>✅ 5 Theme-Analysen pro Monat</li>
      <li>✅ Section-Level Performance Scores</li>
      <li>✅ Konkrete Fix-Empfehlungen</li>
      <li>✅ PDF Reports zum Teilen</li>
    </ul>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #52525b;">
      Statt €29/Monat nur <strong style="color: #10b981;">€23/Monat</strong> mit deinem Code.
    </p>
    
    ${button('Code einlösen →', 'https://thememetrics.de/api/auth/install?shop=' + (data.shopUrl || '') + '&promo=SPEED20')}
  `);
}
