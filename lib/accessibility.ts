/**
 * Accessibility Checker für ThemeMetrics
 * WCAG 2.1 AA Standard Compliance
 */

export type Severity = 'critical' | 'warning' | 'info';
export type Category = 'images' | 'forms' | 'contrast' | 'navigation' | 'interactive' | 'structure';

export interface AccessibilityIssue {
  id: string;
  category: Category;
  severity: Severity;
  wcagCriteria: string;
  title: string;
  description: string;
  element?: string;
  line?: number;
  section?: string;
  fix?: string;
  affectedUsers?: string;
}

export interface SectionAccessibility {
  sectionName: string;
  issues: AccessibilityIssue[];
  score: number;
}

export interface AccessibilityReport {
  overallScore: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  sections: SectionAccessibility[];
  summary: {
    images: number;
    forms: number;
    contrast: number;
    navigation: number;
    interactive: number;
    structure: number;
  };
}

// WCAG Criteria References
const WCAG = {
  NON_TEXT_CONTENT: '1.1.1 Non-text Content',
  CAPTIONS: '1.2.2 Captions',
  CONTRAST_MINIMUM: '1.4.3 Contrast (Minimum)',
  RESIZE_TEXT: '1.4.4 Resize Text',
  KEYBOARD: '2.1.1 Keyboard',
  NO_KEYBOARD_TRAP: '2.1.2 No Keyboard Trap',
  BYPASS_BLOCKS: '2.4.1 Bypass Blocks',
  PAGE_TITLED: '2.4.2 Page Titled',
  FOCUS_ORDER: '2.4.3 Focus Order',
  LINK_PURPOSE: '2.4.4 Link Purpose',
  HEADINGS_LABELS: '2.4.6 Headings and Labels',
  FOCUS_VISIBLE: '2.4.7 Focus Visible',
  LANGUAGE: '3.1.1 Language of Page',
  ON_INPUT: '3.2.2 On Input',
  LABELS_INSTRUCTIONS: '3.3.2 Labels or Instructions',
  NAME_ROLE_VALUE: '4.1.2 Name, Role, Value',
};

/**
 * Analyze a section's Liquid code for accessibility issues
 */
export function analyzeAccessibility(
  sectionName: string,
  liquidCode: string
): SectionAccessibility {
  const issues: AccessibilityIssue[] = [];
  const lines = liquidCode.split('\n');

  // Run all checks
  issues.push(...checkImages(liquidCode, lines, sectionName));
  issues.push(...checkLinks(liquidCode, lines, sectionName));
  issues.push(...checkButtons(liquidCode, lines, sectionName));
  issues.push(...checkForms(liquidCode, lines, sectionName));
  issues.push(...checkHeadings(liquidCode, lines, sectionName));
  issues.push(...checkARIA(liquidCode, lines, sectionName));
  issues.push(...checkFocusStyles(liquidCode, lines, sectionName));
  issues.push(...checkNavigation(liquidCode, lines, sectionName));
  issues.push(...checkInteractive(liquidCode, lines, sectionName));

  // Calculate score
  const score = calculateAccessibilityScore(issues);

  return {
    sectionName,
    issues,
    score,
  };
}

/**
 * Generate a concrete fix for an img tag missing alt attribute
 */
function generateImgFix(imgTag: string): string {
  // Try to detect what kind of image it is
  const isProduct = imgTag.includes('product') || imgTag.includes('item');
  const isBanner = imgTag.includes('banner') || imgTag.includes('hero') || imgTag.includes('slide');
  const isLogo = imgTag.includes('logo');
  const isIcon = imgTag.includes('icon');
  const isSection = imgTag.includes('section.settings');
  
  // Find the insertion point (right after <img)
  let fixedTag = imgTag;
  
  if (isIcon) {
    // Icons should have empty alt or aria-hidden
    fixedTag = imgTag.replace(/<img\s+/, '<img alt="" ');
    return `${fixedTag}\n\n💡 Icons sollten alt="" haben (dekorativ) oder aria-hidden="true"`;
  }
  
  if (isLogo) {
    fixedTag = imgTag.replace(/<img\s+/, '<img alt="Logo" ');
    return `${fixedTag}\n\n💡 Ersetze "Logo" mit deinem Firmennamen, z.B. alt="ThemeMetrics Logo"`;
  }
  
  if (isProduct) {
    fixedTag = imgTag.replace(/<img\s+/, '<img alt="{{ product.title | escape }}" ');
    return `${fixedTag}\n\n💡 Shopify füllt automatisch den Produktnamen ein`;
  }
  
  if (isBanner || isSection) {
    fixedTag = imgTag.replace(/<img\s+/, '<img alt="{{ section.settings.image_alt | default: \'\' }}" ');
    return `${fixedTag}\n\n💡 Füge in deinem Section Schema ein Feld hinzu:\n{\n  "type": "text",\n  "id": "image_alt",\n  "label": "Bildbeschreibung"\n}`;
  }
  
  // Generic fallback
  fixedTag = imgTag.replace(/<img\s+/, '<img alt="Beschreibung hier einfügen" ');
  return `${fixedTag}\n\n💡 Ersetze "Beschreibung hier einfügen" mit einer kurzen Beschreibung des Bildinhalts`;
}

/**
 * Check for image accessibility issues
 */
function checkImages(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Find all img tags
  const imgRegex = /<img\s+[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(code)) !== null) {
    const imgTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);

    // Check for missing alt attribute
    if (!imgTag.includes('alt=') && !imgTag.includes('alt =')) {
      // Generate a concrete fix based on the actual code
      const fixedTag = generateImgFix(imgTag);
      
      issues.push({
        id: `img-no-alt-${lineNumber}`,
        category: 'images',
        severity: 'critical',
        wcagCriteria: WCAG.NON_TEXT_CONTENT,
        title: 'Bild ohne Alt-Text',
        description: 'Dieses Bild hat kein alt-Attribut. Screen Reader können es nicht beschreiben.',
        element: imgTag.substring(0, 150) + (imgTag.length > 150 ? '...' : ''),
        line: lineNumber,
        section,
        fix: fixedTag,
        affectedUsers: '~8% der Bevölkerung mit Sehbehinderung',
      });
    }

    // Check for empty alt on potentially informative images
    const emptyAltMatch = imgTag.match(/alt\s*=\s*["']\s*["']/i);
    if (emptyAltMatch && (imgTag.includes('product') || imgTag.includes('hero') || imgTag.includes('banner'))) {
      const fixedTag = imgTag.replace(/alt\s*=\s*["']\s*["']/i, 'alt="{{ image.alt | escape }}"');
      
      issues.push({
        id: `img-empty-alt-${lineNumber}`,
        category: 'images',
        severity: 'warning',
        wcagCriteria: WCAG.NON_TEXT_CONTENT,
        title: 'Möglicherweise fehlinformatives leeres Alt',
        description: 'Dieses Bild scheint informativ zu sein, hat aber ein leeres alt-Attribut.',
        element: imgTag.substring(0, 150),
        line: lineNumber,
        section,
        fix: fixedTag.substring(0, 200),
      });
    }

    // Check for bad alt text patterns
    const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i);
    if (altMatch) {
      const altText = altMatch[1].toLowerCase();
      const badPatterns = ['image', 'img', 'picture', 'photo', 'foto', 'bild', '.jpg', '.png', '.webp', 'untitled', 'dsc_', 'img_'];
      
      if (badPatterns.some(pattern => altText.includes(pattern)) && altText.length < 20) {
        issues.push({
          id: `img-bad-alt-${lineNumber}`,
          category: 'images',
          severity: 'info',
          wcagCriteria: WCAG.NON_TEXT_CONTENT,
          title: 'Nicht beschreibender Alt-Text',
          description: `Alt-Text "${altMatch[1]}" beschreibt den Bildinhalt nicht.`,
          element: imgTag.substring(0, 150),
          line: lineNumber,
          section,
          fix: `Ersetze alt="${altMatch[1]}" mit einem beschreibenden Text wie:\nalt="Produktbild: Rotes Sommerkleid"\noder für dynamische Bilder:\nalt="{{ product.title | escape }}"`,
        });
      }
    }
  }

  // Check for background images without text alternatives
  const bgImageRegex = /background-image\s*:\s*url\([^)]+\)/gi;
  while ((match = bgImageRegex.exec(code)) !== null) {
    const lineNumber = getLineNumber(code, match.index, lines);
    const surroundingCode = code.substring(Math.max(0, match.index - 200), Math.min(code.length, match.index + 200));
    
    if (!surroundingCode.includes('aria-label') && !surroundingCode.includes('role="img"')) {
      issues.push({
        id: `bg-img-no-alt-${lineNumber}`,
        category: 'images',
        severity: 'warning',
        wcagCriteria: WCAG.NON_TEXT_CONTENT,
        title: 'Hintergrundbild ohne Textalternative',
        description: 'CSS-Hintergrundbilder sind für Screen Reader unsichtbar.',
        line: lineNumber,
        section,
        fix: `Füge zum Element hinzu:\nrole="img" aria-label="Beschreibung des Bildes"\n\nBeispiel:\n<div style="background-image:..." role="img" aria-label="Hero Banner mit Frühlingskollektion">`,
      });
    }
  }

  // Check for video without captions
  const videoRegex = /<video\s+[^>]*>[\s\S]*?<\/video>/gi;
  while ((match = videoRegex.exec(code)) !== null) {
    const videoTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);

    if (!videoTag.includes('<track') && !videoTag.includes('track ')) {
      issues.push({
        id: `video-no-captions-${lineNumber}`,
        category: 'images',
        severity: 'critical',
        wcagCriteria: WCAG.CAPTIONS,
        title: 'Video ohne Untertitel',
        description: 'Dieses Video hat keine Untertitel-Spur.',
        line: lineNumber,
        section,
        fix: 'Füge <track kind="captions" src="captions.vtt" srclang="de"> hinzu.',
        affectedUsers: '~5% der Bevölkerung mit Hörbehinderung',
      });
    }
  }

  return issues;
}

/**
 * Check for link accessibility issues
 */
function checkLinks(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Find all anchor tags
  const linkRegex = /<a\s+[^>]*>[\s\S]*?<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(code)) !== null) {
    const linkTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);

    // Extract link content
    const contentMatch = linkTag.match(/<a\s+[^>]*>([\s\S]*?)<\/a>/i);
    const content = contentMatch ? contentMatch[1].trim() : '';

    // Check for empty links
    const hasAriaLabel = linkTag.includes('aria-label');
    const hasTitle = linkTag.includes('title=');
    const hasVisibleText = content.replace(/<[^>]*>/g, '').trim().length > 0;
    const hasImgWithAlt = content.includes('alt=') && !content.includes('alt=""') && !content.includes("alt=''");

    if (!hasVisibleText && !hasAriaLabel && !hasImgWithAlt) {
      // Generate concrete fix
      const fixedTag = linkTag.replace(/<a\s+/, '<a aria-label="Beschreibung des Links" ');
      
      issues.push({
        id: `link-empty-${lineNumber}`,
        category: 'navigation',
        severity: 'critical',
        wcagCriteria: WCAG.LINK_PURPOSE,
        title: 'Leerer Link',
        description: 'Dieser Link hat keinen zugänglichen Text.',
        element: linkTag.substring(0, 150),
        line: lineNumber,
        section,
        fix: `${fixedTag.substring(0, 200)}\n\n💡 Oder füge sichtbaren Text zwischen <a> und </a> ein:\n<a href="...">Jetzt ansehen</a>`,
        affectedUsers: 'Screen Reader Nutzer können nicht verstehen wohin der Link führt',
      });
    }

    // Check for generic link text
    const genericTexts = ['click here', 'hier klicken', 'read more', 'mehr lesen', 'link', 'hier', 'more', 'mehr'];
    const visibleText = content.replace(/<[^>]*>/g, '').trim().toLowerCase();
    
    if (genericTexts.includes(visibleText)) {
      issues.push({
        id: `link-generic-${lineNumber}`,
        category: 'navigation',
        severity: 'warning',
        wcagCriteria: WCAG.LINK_PURPOSE,
        title: 'Generischer Link-Text',
        description: `"${visibleText}" beschreibt nicht das Linkziel.`,
        element: linkTag.substring(0, 150),
        line: lineNumber,
        section,
        fix: `Ändere den Link-Text zu etwas Beschreibendem:\n\n❌ Vorher: <a href="...">${visibleText}</a>\n✅ Nachher: <a href="...">Alle Produkte ansehen</a>\n\n💡 Der Link-Text sollte auch ohne Kontext verständlich sein`,
      });
    }

    // Check for links opening in new window without warning
    if ((linkTag.includes('target="_blank"') || linkTag.includes("target='_blank'")) && 
        !linkTag.includes('neues Fenster') && 
        !linkTag.includes('new window') &&
        !linkTag.includes('aria-label')) {
      
      const fixedTag = linkTag.replace('target="_blank"', 'target="_blank" aria-label="Linktext (öffnet in neuem Tab)"');
      
      issues.push({
        id: `link-new-window-${lineNumber}`,
        category: 'navigation',
        severity: 'info',
        wcagCriteria: WCAG.ON_INPUT,
        title: 'Link öffnet neues Fenster ohne Hinweis',
        description: 'Nutzer sollten gewarnt werden, wenn ein Link in neuem Tab öffnet.',
        element: linkTag.substring(0, 150),
        line: lineNumber,
        section,
        fix: `Option 1 - Visueller Hinweis:\n<a href="..." target="_blank">Externe Seite ↗</a>\n\nOption 2 - Screen Reader Text:\n<a href="..." target="_blank">Link <span class="sr-only">(öffnet in neuem Tab)</span></a>`,
      });
    }
  }

  return issues;
}

/**
 * Check for button accessibility issues
 */
function checkButtons(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Find all button tags
  const buttonRegex = /<button\s+[^>]*>[\s\S]*?<\/button>/gi;
  let match;

  while ((match = buttonRegex.exec(code)) !== null) {
    const buttonTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);

    // Extract button content
    const contentMatch = buttonTag.match(/<button\s+[^>]*>([\s\S]*?)<\/button>/i);
    const content = contentMatch ? contentMatch[1].trim() : '';

    // Check for empty buttons
    const hasAriaLabel = buttonTag.includes('aria-label');
    const hasTitle = buttonTag.includes('title=');
    const hasVisibleText = content.replace(/<[^>]*>/g, '').trim().length > 0;
    const hasSvgTitle = content.includes('<title>');

    if (!hasVisibleText && !hasAriaLabel && !hasSvgTitle) {
      // Detect button type for better fix
      const isClose = buttonTag.includes('close') || content.includes('×') || content.includes('x');
      const isMenu = buttonTag.includes('menu') || buttonTag.includes('hamburger');
      const isCart = buttonTag.includes('cart') || buttonTag.includes('bag');
      
      let suggestedLabel = 'Aktion beschreiben';
      if (isClose) suggestedLabel = 'Schließen';
      if (isMenu) suggestedLabel = 'Menü öffnen';
      if (isCart) suggestedLabel = 'Warenkorb öffnen';
      
      const fixedTag = buttonTag.replace(/<button\s+/, `<button aria-label="${suggestedLabel}" `);
      
      issues.push({
        id: `button-empty-${lineNumber}`,
        category: 'interactive',
        severity: 'critical',
        wcagCriteria: WCAG.NAME_ROLE_VALUE,
        title: 'Button ohne zugänglichen Namen',
        description: 'Dieser Button hat keinen zugänglichen Text.',
        element: buttonTag.substring(0, 150),
        line: lineNumber,
        section,
        fix: `${fixedTag.substring(0, 200)}\n\n💡 Oder füge sichtbaren Text hinzu:\n<button>Menü</button>`,
        affectedUsers: 'Screen Reader Nutzer wissen nicht was der Button tut',
      });
    }
  }

  // Check for div/span used as buttons
  const fakeButtonRegex = /<(div|span)\s+[^>]*onclick\s*=/gi;
  while ((match = fakeButtonRegex.exec(code)) !== null) {
    const lineNumber = getLineNumber(code, match.index, lines);
    const element = match[0];

    if (!element.includes('role="button"') && !element.includes("role='button'")) {
      issues.push({
        id: `fake-button-${lineNumber}`,
        category: 'interactive',
        severity: 'critical',
        wcagCriteria: WCAG.KEYBOARD,
        title: 'Nicht-interaktives Element als Button verwendet',
        description: 'Ein div/span mit onclick ist nicht keyboard-accessible.',
        element: element.substring(0, 150),
        line: lineNumber,
        section,
        fix: `Am besten: Ersetze mit <button>:\n<button onclick="...">Klick mich</button>\n\nAlternativ (wenn HTML nicht änderbar):\n<div onclick="..." role="button" tabindex="0" onkeydown="if(event.key==='Enter')this.click()">...</div>\n\n💡 <button> ist immer besser weil automatisch keyboard-accessible`,
        affectedUsers: 'Keyboard-Nutzer können dieses Element nicht bedienen',
      });
    }
  }

  return issues;
}

/**
 * Check for form accessibility issues
 */
function checkForms(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Find all input elements
  const inputRegex = /<input\s+[^>]*>/gi;
  let match;

  while ((match = inputRegex.exec(code)) !== null) {
    const inputTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);

    // Skip hidden and submit inputs
    if (inputTag.includes('type="hidden"') || inputTag.includes('type="submit"') || inputTag.includes('type="button"')) {
      continue;
    }

    // Get input id
    const idMatch = inputTag.match(/id\s*=\s*["']([^"']*)["']/i);
    const inputId = idMatch ? idMatch[1] : null;
    
    // Get input type and name for better fix suggestions
    const typeMatch = inputTag.match(/type\s*=\s*["']([^"']*)["']/i);
    const nameMatch = inputTag.match(/name\s*=\s*["']([^"']*)["']/i);
    const inputType = typeMatch ? typeMatch[1] : 'text';
    const inputName = nameMatch ? nameMatch[1] : '';

    // Check for associated label
    const hasAriaLabel = inputTag.includes('aria-label');
    const hasAriaLabelledby = inputTag.includes('aria-labelledby');
    const hasLabelFor = inputId && code.includes(`for="${inputId}"`) || code.includes(`for='${inputId}'`);
    const hasWrappingLabel = checkWrappingLabel(code, match.index);

    if (!hasAriaLabel && !hasAriaLabelledby && !hasLabelFor && !hasWrappingLabel) {
      // Suggest label text based on input type/name
      let suggestedLabel = 'Feldname';
      if (inputType === 'email' || inputName.includes('email')) suggestedLabel = 'E-Mail-Adresse';
      if (inputType === 'password') suggestedLabel = 'Passwort';
      if (inputName.includes('name')) suggestedLabel = 'Name';
      if (inputName.includes('phone') || inputType === 'tel') suggestedLabel = 'Telefonnummer';
      if (inputName.includes('address')) suggestedLabel = 'Adresse';
      
      const suggestedId = inputId || inputName || 'field-id';
      
      issues.push({
        id: `input-no-label-${lineNumber}`,
        category: 'forms',
        severity: 'critical',
        wcagCriteria: WCAG.LABELS_INSTRUCTIONS,
        title: 'Formularfeld ohne Label',
        description: 'Dieses Eingabefeld hat kein zugehöriges Label.',
        element: inputTag.substring(0, 150),
        line: lineNumber,
        section,
        fix: `Option 1 - Sichtbares Label (empfohlen):\n<label for="${suggestedId}">${suggestedLabel}</label>\n${inputTag.includes('id=') ? inputTag : inputTag.replace('<input', `<input id="${suggestedId}"`)}\n\nOption 2 - Verstecktes Label:\n${inputTag.replace('<input', `<input aria-label="${suggestedLabel}"`)}\n\n💡 Sichtbare Labels sind besser für alle Nutzer!`,
        affectedUsers: 'Screen Reader Nutzer wissen nicht was eingegeben werden soll',
      });
    }

    // Check for placeholder-only labels
    if (inputTag.includes('placeholder=') && !hasAriaLabel && !hasLabelFor && !hasWrappingLabel) {
      const placeholderMatch = inputTag.match(/placeholder\s*=\s*["']([^"']*)["']/i);
      const placeholder = placeholderMatch ? placeholderMatch[1] : 'Text';
      
      issues.push({
        id: `input-placeholder-only-${lineNumber}`,
        category: 'forms',
        severity: 'warning',
        wcagCriteria: WCAG.LABELS_INSTRUCTIONS,
        title: 'Nur Placeholder statt Label',
        description: 'Placeholder verschwindet beim Tippen und ist kein Ersatz für Labels.',
        element: inputTag.substring(0, 150),
        line: lineNumber,
        section,
        fix: `Füge ein sichtbares Label hinzu:\n\n<label for="field-id">${placeholder}</label>\n${inputTag}\n\n💡 Der Placeholder kann zusätzlich als Beispiel dienen:\nplaceholder="z.B. max@example.com"`,
      });
    }

    // Check for autocomplete on relevant inputs
    const autocompleteFields: Record<string, string> = {
      'email': 'email',
      'name': 'name',
      'first_name': 'given-name',
      'last_name': 'family-name',
      'tel': 'tel',
      'phone': 'tel',
      'address': 'street-address',
      'zip': 'postal-code',
      'postal': 'postal-code',
      'city': 'address-level2',
      'country': 'country-name',
    };

    const expectedAutocomplete = autocompleteFields[inputName.toLowerCase()] || autocompleteFields[inputType];
    if (expectedAutocomplete && !inputTag.includes('autocomplete=')) {
      issues.push({
        id: `input-no-autocomplete-${lineNumber}`,
        category: 'forms',
        severity: 'info',
        wcagCriteria: WCAG.LABELS_INSTRUCTIONS,
        title: 'Fehlendes autocomplete Attribut',
        description: 'Autocomplete hilft Nutzern beim schnelleren Ausfüllen.',
        element: inputTag.substring(0, 100),
        line: lineNumber,
        section,
        fix: `Füge autocomplete="${expectedAutocomplete}" hinzu.`,
      });
    }
  }

  // Check for select without label
  const selectRegex = /<select\s+[^>]*>/gi;
  while ((match = selectRegex.exec(code)) !== null) {
    const selectTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);

    const idMatch = selectTag.match(/id\s*=\s*["']([^"']*)["']/i);
    const selectId = idMatch ? idMatch[1] : null;

    const hasAriaLabel = selectTag.includes('aria-label');
    const hasLabelFor = selectId && (code.includes(`for="${selectId}"`) || code.includes(`for='${selectId}'`));

    if (!hasAriaLabel && !hasLabelFor) {
      issues.push({
        id: `select-no-label-${lineNumber}`,
        category: 'forms',
        severity: 'critical',
        wcagCriteria: WCAG.LABELS_INSTRUCTIONS,
        title: 'Auswahlfeld ohne Label',
        description: 'Dieses Select-Element hat kein zugehöriges Label.',
        element: selectTag.substring(0, 100),
        line: lineNumber,
        section,
        fix: 'Füge <label for="select-id">Auswahl</label> hinzu.',
      });
    }
  }

  return issues;
}

/**
 * Check heading structure
 */
function checkHeadings(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Find all headings
  const headingRegex = /<h([1-6])\s*[^>]*>[\s\S]*?<\/h\1>/gi;
  const headings: { level: number; line: number; content: string }[] = [];
  let match;

  while ((match = headingRegex.exec(code)) !== null) {
    const level = parseInt(match[1]);
    const lineNumber = getLineNumber(code, match.index, lines);
    headings.push({ level, line: lineNumber, content: match[0] });
  }

  // Check for skipped heading levels
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];

    if (curr.level > prev.level + 1) {
      issues.push({
        id: `heading-skip-${curr.line}`,
        category: 'structure',
        severity: 'warning',
        wcagCriteria: WCAG.HEADINGS_LABELS,
        title: 'Übersprungene Heading-Ebene',
        description: `Sprung von h${prev.level} zu h${curr.level}. h${prev.level + 1} fehlt.`,
        line: curr.line,
        section,
        fix: `Verwende h${prev.level + 1} statt h${curr.level} oder füge Zwischen-Headings ein.`,
      });
    }
  }

  // Check for empty headings
  const emptyHeadingRegex = /<h([1-6])\s*[^>]*>\s*<\/h\1>/gi;
  while ((match = emptyHeadingRegex.exec(code)) !== null) {
    const lineNumber = getLineNumber(code, match.index, lines);
    issues.push({
      id: `heading-empty-${lineNumber}`,
      category: 'structure',
      severity: 'warning',
      wcagCriteria: WCAG.HEADINGS_LABELS,
      title: 'Leere Überschrift',
      description: 'Diese Überschrift hat keinen Inhalt.',
      line: lineNumber,
      section,
      fix: 'Füge Text hinzu oder entferne das leere Heading-Element.',
    });
  }

  return issues;
}

/**
 * Check ARIA usage
 */
function checkARIA(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for aria-hidden on focusable elements
  const ariaHiddenFocusable = /aria-hidden\s*=\s*["']true["'][^>]*(tabindex|href|onclick)/gi;
  let match;

  while ((match = ariaHiddenFocusable.exec(code)) !== null) {
    const lineNumber = getLineNumber(code, match.index, lines);
    issues.push({
      id: `aria-hidden-focusable-${lineNumber}`,
      category: 'interactive',
      severity: 'critical',
      wcagCriteria: WCAG.NAME_ROLE_VALUE,
      title: 'aria-hidden auf fokussierbarem Element',
      description: 'Element ist für Screen Reader versteckt aber keyboard-fokussierbar.',
      line: lineNumber,
      section,
      fix: 'Entferne aria-hidden="true" oder mache das Element nicht fokussierbar.',
    });
  }

  // Check for invalid ARIA roles
  const validRoles = ['alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'];
  
  const roleRegex = /role\s*=\s*["']([^"']*)["']/gi;
  while ((match = roleRegex.exec(code)) !== null) {
    const role = match[1].toLowerCase();
    const lineNumber = getLineNumber(code, match.index, lines);

    if (!validRoles.includes(role)) {
      issues.push({
        id: `aria-invalid-role-${lineNumber}`,
        category: 'interactive',
        severity: 'warning',
        wcagCriteria: WCAG.NAME_ROLE_VALUE,
        title: 'Ungültige ARIA-Rolle',
        description: `"${role}" ist keine gültige ARIA-Rolle.`,
        line: lineNumber,
        section,
        fix: 'Verwende eine gültige ARIA-Rolle wie "button", "link", "dialog", etc.',
      });
    }
  }

  return issues;
}

/**
 * Check focus styles
 */
function checkFocusStyles(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for outline:none without alternative
  const outlineNoneRegex = /outline\s*:\s*none|outline\s*:\s*0/gi;
  let match;

  while ((match = outlineNoneRegex.exec(code)) !== null) {
    const lineNumber = getLineNumber(code, match.index, lines);
    const surroundingCode = code.substring(Math.max(0, match.index - 100), Math.min(code.length, match.index + 100));

    // Check if there's an alternative focus style
    const hasAlternative = surroundingCode.includes('box-shadow') || 
                          surroundingCode.includes('border') ||
                          surroundingCode.includes('background');

    if (!hasAlternative) {
      issues.push({
        id: `focus-outline-none-${lineNumber}`,
        category: 'interactive',
        severity: 'critical',
        wcagCriteria: WCAG.FOCUS_VISIBLE,
        title: 'Focus-Indikator entfernt',
        description: 'outline:none ohne alternative Focus-Styles macht Navigation für Keyboard-Nutzer unmöglich.',
        line: lineNumber,
        section,
        fix: 'Füge alternative Focus-Styles hinzu: :focus { box-shadow: 0 0 0 2px #4F46E5; }',
        affectedUsers: 'Keyboard-Nutzer und Menschen mit motorischen Einschränkungen',
      });
    }
  }

  return issues;
}

/**
 * Check navigation accessibility
 */
function checkNavigation(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for skip link (only in header sections)
  if (section.toLowerCase().includes('header') || section.toLowerCase().includes('navigation')) {
    if (!code.includes('skip') && !code.includes('Skip') && !code.includes('Zum Inhalt')) {
      issues.push({
        id: `nav-no-skip-link`,
        category: 'navigation',
        severity: 'warning',
        wcagCriteria: WCAG.BYPASS_BLOCKS,
        title: 'Fehlender Skip-Link',
        description: 'Ein "Skip to content" Link hilft Keyboard-Nutzern die Navigation zu überspringen.',
        section,
        fix: `<a href="#main-content" class="skip-link">Zum Inhalt springen</a>\n\n💡 Füge diesen Link direkt nach dem <body> Tag in theme.liquid ein.\n\nCSS für den Skip-Link (in base.css):\n.skip-link {\n  position: absolute;\n  top: -40px;\n  left: 0;\n  padding: 8px 16px;\n  background: #4F46E5;\n  color: white;\n  z-index: 100;\n}\n.skip-link:focus {\n  top: 0;\n}\n\nUnd füge id="main-content" zu deinem <main> Tag hinzu.`,
        affectedUsers: 'Keyboard-Nutzer müssen sonst durch alle Menüpunkte navigieren',
      });
    }
  }

  // Check for nav without aria-label when multiple navs exist
  const navCount = (code.match(/<nav/gi) || []).length;
  if (navCount > 1) {
    const navRegex = /<nav\s+[^>]*>/gi;
    let match;
    
    while ((match = navRegex.exec(code)) !== null) {
      const navTag = match[0];
      const lineNumber = getLineNumber(code, match.index, lines);

      if (!navTag.includes('aria-label') && !navTag.includes('aria-labelledby')) {
        // Generate concrete fix
        const fixedTag = navTag.replace(/<nav\s+/, '<nav aria-label="Hauptnavigation" ');
        
        issues.push({
          id: `nav-no-label-${lineNumber}`,
          category: 'navigation',
          severity: 'warning',
          wcagCriteria: WCAG.BYPASS_BLOCKS,
          title: 'Navigation ohne Bezeichnung',
          description: 'Bei mehreren nav-Elementen sollte jedes ein aria-label haben.',
          element: navTag.substring(0, 100),
          line: lineNumber,
          section,
          fix: `${fixedTag}\n\n💡 Verwende beschreibende Namen:\n• "Hauptnavigation" - für das Hauptmenü\n• "Footer-Navigation" - für Links im Footer\n• "Breadcrumb" - für Breadcrumb-Navigation\n• "Produktfilter" - für Filter-Menüs`,
          affectedUsers: 'Screen Reader Nutzer können nicht zwischen Navigationen unterscheiden',
        });
      }
    }
  }

  return issues;
}

/**
 * Check interactive elements
 */
function checkInteractive(code: string, lines: string[], section: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for tabindex > 0
  const tabindexRegex = /tabindex\s*=\s*["']([^"']*)["']/gi;
  let match;

  while ((match = tabindexRegex.exec(code)) !== null) {
    const tabindex = parseInt(match[1]);
    const lineNumber = getLineNumber(code, match.index, lines);

    if (tabindex > 0) {
      issues.push({
        id: `tabindex-positive-${lineNumber}`,
        category: 'interactive',
        severity: 'warning',
        wcagCriteria: WCAG.FOCUS_ORDER,
        title: 'Positiver tabindex-Wert',
        description: `tabindex="${tabindex}" verändert die natürliche Tab-Reihenfolge.`,
        line: lineNumber,
        section,
        fix: 'Verwende tabindex="0" oder entferne tabindex und ordne Elemente im DOM korrekt an.',
      });
    }
  }

  // Check for mouse-only interactions
  const mouseOnlyRegex = /onmouse(over|out|enter|leave)\s*=/gi;
  while ((match = mouseOnlyRegex.exec(code)) !== null) {
    const lineNumber = getLineNumber(code, match.index, lines);
    const surroundingCode = code.substring(Math.max(0, match.index - 100), Math.min(code.length, match.index + 200));

    // Check if keyboard equivalent exists
    const hasKeyboard = surroundingCode.includes('onfocus') || 
                       surroundingCode.includes('onblur') ||
                       surroundingCode.includes('onkeydown') ||
                       surroundingCode.includes('onkeyup');

    if (!hasKeyboard) {
      issues.push({
        id: `mouse-only-${lineNumber}`,
        category: 'interactive',
        severity: 'warning',
        wcagCriteria: WCAG.KEYBOARD,
        title: 'Nur Maus-Interaktion',
        description: 'Mouse-Events ohne Keyboard-Äquivalent.',
        line: lineNumber,
        section,
        fix: 'Füge onfocus/onblur oder onkeydown Handler für Keyboard-Nutzer hinzu.',
      });
    }
  }

  return issues;
}

/**
 * Helper: Get line number from character index
 */
function getLineNumber(code: string, charIndex: number, lines: string[]): number {
  let currentIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    currentIndex += lines[i].length + 1; // +1 for newline
    if (currentIndex > charIndex) {
      return i + 1;
    }
  }
  return lines.length;
}

/**
 * Helper: Check if input is wrapped in a label
 */
function checkWrappingLabel(code: string, inputIndex: number): boolean {
  // Look backwards for <label> and forwards for </label>
  const before = code.substring(Math.max(0, inputIndex - 200), inputIndex);
  const after = code.substring(inputIndex, Math.min(code.length, inputIndex + 200));

  const hasLabelBefore = before.lastIndexOf('<label') > before.lastIndexOf('</label>');
  const hasLabelAfter = after.indexOf('</label>') !== -1 && 
                       (after.indexOf('</label>') < after.indexOf('<label') || after.indexOf('<label') === -1);

  return hasLabelBefore && hasLabelAfter;
}

/**
 * Calculate accessibility score
 */
export function calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 10;
        break;
      case 'warning':
        score -= 3;
        break;
      case 'info':
        score -= 1;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate full accessibility report
 */
export function generateAccessibilityReport(sections: SectionAccessibility[]): AccessibilityReport {
  const allIssues = sections.flatMap(s => s.issues);

  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;
  const infoCount = allIssues.filter(i => i.severity === 'info').length;

  const overallScore = calculateAccessibilityScore(allIssues);

  const summary = {
    images: allIssues.filter(i => i.category === 'images').length,
    forms: allIssues.filter(i => i.category === 'forms').length,
    contrast: allIssues.filter(i => i.category === 'contrast').length,
    navigation: allIssues.filter(i => i.category === 'navigation').length,
    interactive: allIssues.filter(i => i.category === 'interactive').length,
    structure: allIssues.filter(i => i.category === 'structure').length,
  };

  return {
    overallScore,
    totalIssues: allIssues.length,
    criticalCount,
    warningCount,
    infoCount,
    sections,
    summary,
  };
}

/**
 * Get score label
 */
export function getAccessibilityLabel(score: number): string {
  if (score >= 90) return 'Exzellent';
  if (score >= 70) return 'Gut';
  if (score >= 50) return 'Problematisch';
  return 'Kritisch';
}

/**
 * Get score color
 */
export function getAccessibilityColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}
