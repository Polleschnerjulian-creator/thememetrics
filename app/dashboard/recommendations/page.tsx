'use client';

import { useAppBridge } from '@/components/providers/AppBridgeProvider';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { RecommendationsSkeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  X,
  Info,
  Play,
  ListOrdered,
  Lock,
  Crown
} from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';

interface Section {
  name: string;
  type: string;
  performanceScore: number;
  recommendations: string[];
}

interface CodeFix {
  title: string;
  description: string;
  file: string;
  lineHint?: string;
  codeBefore?: string;
  codeAfter: string;
  explanation: string;
}

interface StepGuide {
  steps: { title: string; description: string; tip?: string }[];
  difficulty: 'einfach' | 'mittel' | 'fortgeschritten';
  timeEstimate: string;
}

const CODE_FIXES: Record<string, CodeFix> = {
  // === HERO SECTION FIXES ===
  'Hero Section enthält Video': {
    title: 'Video durch optimiertes Bild ersetzen',
    description: 'Ersetze das Video-Element durch ein optimiertes Bild für schnellere Ladezeiten.',
    file: 'sections/hero.liquid',
    lineHint: 'Suche nach <video> oder video_tag',
    codeBefore: `<video autoplay muted loop playsinline>
  <source src="{{ section.settings.video_url }}" type="video/mp4">
</video>`,
    codeAfter: `{{- section.settings.hero_image | image_url: width: 1920 | image_tag:
    loading: 'eager',
    fetchpriority: 'high',
    sizes: '100vw',
    widths: '375, 750, 1100, 1500, 1920',
    class: 'hero-image'
-}}`,
    explanation: 'Videos blockieren das Rendering. Ein optimiertes Bild mit fetchpriority="high" lädt 2-3x schneller.'
  },
  'Hero Section ist zu langsam': {
    title: 'Hero-Bilder mit Preload optimieren',
    description: 'Füge preload für kritische Above-the-Fold Bilder hinzu.',
    file: 'layout/theme.liquid (im <head>) + sections/hero.liquid',
    codeBefore: `{{ section.settings.image | image_url: width: 1500 | image_tag }}`,
    codeAfter: `{%- comment -%} In layout/theme.liquid im <head>: {%- endcomment -%}
{%- assign hero_image = sections['hero'].settings.image -%}
{%- if hero_image -%}
  <link rel="preload" as="image" href="{{ hero_image | image_url: width: 1500 }}" 
        imagesrcset="{{ hero_image | image_url: width: 750 }} 750w,
                     {{ hero_image | image_url: width: 1100 }} 1100w,
                     {{ hero_image | image_url: width: 1500 }} 1500w"
        imagesizes="100vw">
{%- endif -%}

{%- comment -%} In sections/hero.liquid: {%- endcomment -%}
{{- section.settings.image | image_url: width: 1500 | image_tag:
    loading: 'eager',
    fetchpriority: 'high',
    decoding: 'sync',
    sizes: '100vw',
    widths: '375, 750, 1100, 1500'
-}}`,
    explanation: 'Preload weist den Browser an, das Bild sofort zu laden – noch bevor CSS geparst wird. Kann LCP um 200-500ms verbessern.'
  },

  // === LAZY LOADING FIXES ===
  'Lazy Loading fehlt': {
    title: 'Lazy Loading für Below-the-Fold aktivieren',
    description: 'Bilder unterhalb des sichtbaren Bereichs sollten lazy geladen werden.',
    file: 'sections/[section-name].liquid',
    codeBefore: `{{ product.featured_image | image_url: width: 600 | image_tag }}`,
    codeAfter: `{{- product.featured_image | image_url: width: 600 | image_tag:
    loading: 'lazy',
    decoding: 'async',
    sizes: '(min-width: 750px) 50vw, 100vw',
    widths: '300, 450, 600'
-}}`,
    explanation: 'Lazy Loading verhindert, dass Bilder die initiale Ladezeit blockieren. Browser laden sie erst wenn sie sichtbar werden.'
  },

  // === INSTAGRAM/SOCIAL FIXES ===
  'Instagram Feed eingebettet': {
    title: 'Instagram Embed durch statische Bilder ersetzen',
    description: 'Externe Instagram-Embeds laden ~1.5MB JavaScript. Nutze stattdessen statische Bilder.',
    file: 'sections/instagram.liquid',
    codeBefore: `<script async src="//www.instagram.com/embed.js"></script>
<blockquote class="instagram-media" data-instgrm-permalink="...">
</blockquote>`,
    codeAfter: `<div class="instagram-grid grid grid-cols-2 md:grid-cols-4 gap-4">
  {%- for block in section.blocks -%}
    <a href="{{ section.settings.instagram_url }}" 
       target="_blank" 
       rel="noopener"
       class="instagram-item aspect-square overflow-hidden">
      {{- block.settings.image | image_url: width: 400 | image_tag:
          loading: 'lazy',
          class: 'w-full h-full object-cover hover:scale-105 transition-transform'
      -}}
    </a>
  {%- endfor -%}
</div>`,
    explanation: 'Statische Bilder laden 10x schneller und verbrauchen keine externe API-Requests. Update die Bilder manuell alle paar Wochen.'
  },

  // === VIDEO FIXES ===
  'Video außerhalb der Hero Section': {
    title: 'Video durch Bild mit Play-Button ersetzen',
    description: 'Videos auf der Seite erst bei Klick laden (Facade Pattern).',
    file: 'sections/[video-section].liquid',
    codeBefore: `<video autoplay muted loop>
  <source src="{{ section.settings.video }}" type="video/mp4">
</video>`,
    codeAfter: `<div class="video-facade" data-video-url="{{ section.settings.video }}">
  {{- section.settings.poster_image | image_url: width: 1200 | image_tag:
      loading: 'lazy',
      class: 'video-poster'
  -}}
  <button class="play-button" aria-label="Video abspielen">
    <svg><!-- Play Icon --></svg>
  </button>
</div>

<script>
document.querySelectorAll('.video-facade').forEach(facade => {
  facade.addEventListener('click', function() {
    const video = document.createElement('video');
    video.src = this.dataset.videoUrl;
    video.autoplay = true;
    video.controls = true;
    this.replaceWith(video);
  });
});
</script>`,
    explanation: 'Das Facade Pattern zeigt erst ein Poster-Bild. Video wird nur geladen wenn der User es wirklich abspielen will – spart initial ~2-5MB.'
  },

  // === COMPLEXITY FIXES ===
  'Hohe Code-Komplexität': {
    title: 'Liquid-Code optimieren und aufteilen',
    description: 'Verschachtelte Loops und Conditions verlangsamen das Server-Rendering.',
    file: 'sections/[section-name].liquid',
    codeBefore: `{%- for product in collection.products -%}
  {%- if product.available -%}
    {%- for variant in product.variants -%}
      {%- if variant.available -%}
        {%- assign price = variant.price -%}
        {%- if variant.compare_at_price > price -%}
          <span class="sale">{{ price | money }}</span>
        {%- else -%}
          <span>{{ price | money }}</span>
        {%- endif -%}
      {%- endif -%}
    {%- endfor -%}
  {%- endif -%}
{%- endfor -%}`,
    codeAfter: `{%- comment -%} Extrahiere Logik in einen Snippet {%- endcomment -%}
{%- for product in collection.products -%}
  {%- if product.available -%}
    {%- render 'product-price', product: product -%}
  {%- endif -%}
{%- endfor -%}

{%- comment -%} snippets/product-price.liquid: {%- endcomment -%}
{%- assign current_variant = product.selected_or_first_available_variant -%}
{%- if current_variant.compare_at_price > current_variant.price -%}
  <span class="price price--sale">{{ current_variant.price | money }}</span>
  <s class="price price--compare">{{ current_variant.compare_at_price | money }}</s>
{%- else -%}
  <span class="price">{{ current_variant.price | money }}</span>
{%- endif -%}`,
    explanation: 'Snippets machen Code wiederverwendbar und reduzieren Verschachtelung. Vermeide Loops in Loops wo möglich.'
  },

  // === ANIMATION FIXES ===
  'Schwere Animationen erkannt': {
    title: 'Animationen auf GPU-beschleunigte Properties beschränken',
    description: 'Nur transform und opacity können hardware-beschleunigt werden.',
    file: 'assets/[stylesheet].css',
    codeBefore: `.animated-element {
  transition: all 0.3s ease;
  /* oder */
  animation: slide-in 0.5s;
}
@keyframes slide-in {
  from { left: -100%; opacity: 0; }
  to { left: 0; opacity: 1; }
}`,
    codeAfter: `.animated-element {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
}
@keyframes slide-in {
  from { 
    transform: translateX(-100%); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0); 
    opacity: 1; 
  }
}

/* Deaktiviere Animationen bei prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: none;
    animation: none;
  }
}`,
    explanation: 'transform und opacity triggern kein Layout/Paint und laufen auf der GPU. "left", "width", "margin" etc. sind teuer und verursachen Ruckeln.'
  },

  // === TOTAL LOAD TIME FIXES ===
  'Gesamte Ladezeit zu hoch': {
    title: 'Kritischen Rendering-Pfad optimieren',
    description: 'Priorisiere Above-the-Fold Content und verzögere den Rest.',
    file: 'layout/theme.liquid',
    codeAfter: `{%- comment -%} 1. Critical CSS inline im <head> {%- endcomment -%}
<style>
  /* Nur Above-the-Fold Styles hier */
  .header, .hero { /* minimal styles */ }
</style>

{%- comment -%} 2. Render-blocking CSS asynchron laden {%- endcomment -%}
<link rel="preload" href="{{ 'theme.css' | asset_url }}" as="style" onload="this.rel='stylesheet'">

{%- comment -%} 3. Nicht-kritische Sections verzögert laden {%- endcomment -%}
<script>
  // Intersection Observer für Lazy Sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  });
  document.querySelectorAll('.lazy-section').forEach(el => observer.observe(el));
</script>`,
    explanation: 'Der Browser rendert erst wenn CSS geladen ist. Inline kritisches CSS und lade den Rest asynchron.'
  },

  // === TOO MANY SECTIONS FIX ===
  'Zu viele Sections auf der Homepage': {
    title: 'Sections konsolidieren oder entfernen',
    description: 'Jede Section bedeutet mehr DOM, mehr CSS, mehr JavaScript.',
    file: 'templates/index.json',
    codeAfter: `{%- comment -%} 
EMPFOHLENE SECTION-STRUKTUR (8 Sections):

1. header (required)
2. announcement-bar (optional)
3. hero / slideshow
4. featured-collection (1x, nicht 3x!)
5. image-with-text ODER testimonials
6. newsletter
7. footer (required)

ENTFERNEN/KOMBINIEREN:
- Mehrere "Featured Collection" → Eine mit Tabs
- "Instagram" → In Footer integrieren oder entfernen
- "Brand Story" + "About" → Kombinieren
- "Partners/Logos" → In Footer
{%- endcomment -%}`,
    explanation: 'Shops mit 8 Sections laden durchschnittlich 40% schneller als solche mit 15+. Weniger ist mehr.'
  },

  // === ABOVE FOLD OPTIMIZATION ===
  'Above-the-fold Optimierung empfohlen': {
    title: 'Above-the-Fold priorisieren',
    description: 'Kritische Ressourcen zuerst, Below-the-Fold verzögern.',
    file: 'layout/theme.liquid + sections/',
    codeAfter: `{%- comment -%} layout/theme.liquid - Im <head>: {%- endcomment -%}

{%- comment -%} 1. Preload kritische Ressourcen {%- endcomment -%}
<link rel="preload" href="{{ 'hero-image.jpg' | asset_url }}" as="image">
<link rel="preload" href="{{ 'custom-font.woff2' | asset_url }}" as="font" crossorigin>

{%- comment -%} 2. Preconnect zu externen Domains {%- endcomment -%}
<link rel="preconnect" href="https://cdn.shopify.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

{%- comment -%} In sections - Above-the-fold (Hero, Header): {%- endcomment -%}
loading: 'eager', fetchpriority: 'high'

{%- comment -%} In sections - Below-the-fold (alles andere): {%- endcomment -%}
loading: 'lazy', decoding: 'async'`,
    explanation: 'Der Browser weiß nicht was "above the fold" ist. Mit preload und fetchpriority gibst du ihm klare Prioritäten.'
  },

  // === RESPONSIVE IMAGES ===
  'Keine responsiven Bilder': {
    title: 'Responsive Bilder mit srcset implementieren',
    description: 'Mobile Geräte laden unnötig große Bilder ohne srcset.',
    file: 'sections/[section-name].liquid',
    codeBefore: `<img src="{{ image | image_url: width: 1500 }}" alt="{{ image.alt }}">`,
    codeAfter: `{{- image | image_url: width: 1500 | image_tag:
    srcset: image | image_url: width: 375 | append: ' 375w, ' 
          | append: image | image_url: width: 750 | append: ' 750w, '
          | append: image | image_url: width: 1100 | append: ' 1100w, '
          | append: image | image_url: width: 1500 | append: ' 1500w',
    sizes: '(min-width: 1200px) 1100px, (min-width: 750px) calc(100vw - 40px), calc(100vw - 20px)',
    loading: 'lazy',
    alt: image.alt | escape
-}}`,
    explanation: 'Mit srcset lädt ein iPhone SE nur ein 375px Bild (~30KB) statt 1500px (~200KB). Spart 80% Traffic auf Mobile.'
  },

  // === FONT OPTIMIZATION ===
  'Externe Fonts blockieren Rendering': {
    title: 'Web Fonts optimieren',
    description: 'Google Fonts oder Custom Fonts können das Rendering um 100-500ms verzögern.',
    file: 'layout/theme.liquid',
    codeBefore: `<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">`,
    codeAfter: `{%- comment -%} Option 1: font-display: swap (bereits im URL mit display=swap) {%- endcomment -%}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">

{%- comment -%} Option 2 (besser): Self-host Fonts {%- endcomment -%}
<style>
  @font-face {
    font-family: 'Open Sans';
    src: url('{{ "OpenSans-Regular.woff2" | asset_url }}') format('woff2');
    font-weight: 400;
    font-display: swap;
  }
</style>`,
    explanation: 'font-display: swap zeigt sofort System-Fonts und tauscht sie, sobald Custom Fonts geladen sind. Kein FOIT (Flash of Invisible Text).'
  },

  // === THIRD PARTY SCRIPTS ===
  'Zu viele externe Scripts': {
    title: 'Third-Party Scripts optimieren',
    description: 'Jedes externe Script blockiert potenziell das Rendering.',
    file: 'layout/theme.liquid',
    codeAfter: `{%- comment -%} 1. Analytics/Tracking async laden {%- endcomment -%}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>

{%- comment -%} 2. Nicht-kritische Scripts verzögern {%- endcomment -%}
<script>
  window.addEventListener('load', function() {
    // Chat-Widget erst nach Page Load
    setTimeout(function() {
      var script = document.createElement('script');
      script.src = 'https://chat-widget.com/widget.js';
      document.body.appendChild(script);
    }, 3000);
  });
</script>

{%- comment -%} 3. Oder: Scripts erst bei User-Interaktion laden {%- endcomment -%}
<script>
  ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(event => {
    window.addEventListener(event, function loadScripts() {
      // Lade Chat, Reviews, etc.
      ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(e => {
        window.removeEventListener(e, loadScripts);
      });
    }, { once: true });
  });
</script>`,
    explanation: 'Chat-Widgets, Review-Apps, etc. sind selten kritisch für die erste Interaktion. Verzögere sie um 3+ Sekunden oder bis User-Interaktion.'
  },
};

function getStepGuide(rec: string): StepGuide {
  // Hero Section Issues
  if (rec.includes('Hero') && rec.includes('Video')) {
    return {
      difficulty: 'mittel',
      timeEstimate: '10-15 Min',
      steps: [
        { title: 'Theme-Editor öffnen', description: 'Onlineshop → Themes → Aktionen → Code bearbeiten' },
        { title: 'Hero Section finden', description: 'Öffne sections/hero.liquid oder ähnlich benannte Datei' },
        { title: 'Video-Tag finden', description: 'Suche nach <video> oder video_tag oder video_url' },
        { title: 'Durch Bild ersetzen', description: 'Ersetze den kompletten Video-Block mit dem optimierten Bild-Code', tip: 'Mache vorher ein Backup deines Themes!' },
        { title: 'Poster-Bild hochladen', description: 'Lade ein Standbild des Videos als Ersatz hoch' },
        { title: 'Testen', description: 'Prüfe im Preview ob das Bild korrekt angezeigt wird' }
      ]
    };
  }
  
  if (rec.includes('Hero') && (rec.includes('langsam') || rec.includes('Preload'))) {
    return {
      difficulty: 'mittel',
      timeEstimate: '10-15 Min',
      steps: [
        { title: 'layout/theme.liquid öffnen', description: 'Dies ist die Hauptdatei deines Themes' },
        { title: '<head> Bereich finden', description: 'Suche nach dem <head> Tag am Anfang' },
        { title: 'Preload-Link hinzufügen', description: 'Füge den <link rel="preload"> Code direkt nach <head> ein' },
        { title: 'Hero-Section anpassen', description: 'Öffne sections/hero.liquid und füge fetchpriority="high" hinzu' },
        { title: 'Testen', description: 'Nutze PageSpeed Insights um die Verbesserung zu messen' }
      ]
    };
  }

  // Lazy Loading
  if (rec.includes('Lazy Loading')) {
    return {
      difficulty: 'einfach',
      timeEstimate: '5-10 Min',
      steps: [
        { title: 'Theme-Editor öffnen', description: 'Onlineshop → Themes → Code bearbeiten' },
        { title: 'Section finden', description: 'Öffne die betroffene Section-Datei (z.B. featured-collection.liquid)' },
        { title: 'Bild-Tags suchen', description: 'Suche nach image_tag oder <img' },
        { title: 'loading="lazy" hinzufügen', description: 'Ändere image_tag: loading: "lazy", decoding: "async"', tip: 'Nicht bei Hero-Bildern – die sollen eager bleiben!' },
        { title: 'Speichern & Testen', description: 'Speichere und prüfe ob Bilder beim Scrollen laden' }
      ]
    };
  }

  // Instagram Embed
  if (rec.includes('Instagram')) {
    return {
      difficulty: 'mittel',
      timeEstimate: '20-30 Min',
      steps: [
        { title: 'Section identifizieren', description: 'Finde sections/instagram.liquid oder social-feed.liquid' },
        { title: 'Embed-Code entfernen', description: 'Lösche den <script src="instagram.com/embed.js"> Code' },
        { title: 'Statisches Grid erstellen', description: 'Ersetze durch ein Grid mit manuell hochgeladenen Bildern' },
        { title: 'Schema anpassen', description: 'Füge Blocks für Bilder im Schema hinzu' },
        { title: 'Bilder hochladen', description: 'Lade 4-8 deiner besten Instagram-Bilder hoch' },
        { title: 'Link setzen', description: 'Verlinke das Grid zu deinem Instagram-Profil' }
      ]
    };
  }

  // Complexity Issues
  if (rec.includes('Komplexität') || rec.includes('komplex')) {
    return {
      difficulty: 'fortgeschritten',
      timeEstimate: '30-60 Min',
      steps: [
        { title: 'Section analysieren', description: 'Öffne die betroffene Section und analysiere die Struktur' },
        { title: 'Verschachtelungen finden', description: 'Suche nach for-Loops in for-Loops ({% for ... %} {% for ... %})', tip: 'Das ist oft der Hauptgrund für hohe Komplexität' },
        { title: 'Snippet erstellen', description: 'Erstelle eine neue Datei in snippets/, z.B. product-card.liquid' },
        { title: 'Code extrahieren', description: 'Verschiebe wiederholten Code ins Snippet' },
        { title: 'Render einsetzen', description: 'Nutze {% render "product-card", product: product %}' },
        { title: 'Testen', description: 'Prüfe ob alles noch funktioniert' }
      ]
    };
  }

  // Animation Issues
  if (rec.includes('Animation')) {
    return {
      difficulty: 'mittel',
      timeEstimate: '15-20 Min',
      steps: [
        { title: 'CSS-Datei finden', description: 'Öffne assets/theme.css oder die Haupt-CSS-Datei' },
        { title: 'Animationen suchen', description: 'Suche nach @keyframes, animation:, transition:' },
        { title: 'Properties anpassen', description: 'Ändere left, width, margin zu transform: translateX()' },
        { title: 'will-change hinzufügen', description: 'Füge will-change: transform, opacity; hinzu' },
        { title: 'Reduced Motion', description: 'Füge @media (prefers-reduced-motion) Fallback hinzu' },
        { title: 'Performance testen', description: 'Teste auf mobilen Geräten' }
      ]
    };
  }

  // Responsive Images
  if (rec.includes('responsiv') || rec.includes('srcset')) {
    return {
      difficulty: 'einfach',
      timeEstimate: '10-15 Min',
      steps: [
        { title: 'Section öffnen', description: 'Öffne die betroffene Section-Datei' },
        { title: 'image_tag finden', description: 'Suche nach {{ ... | image_tag }}' },
        { title: 'widths hinzufügen', description: 'Füge widths: "300, 450, 600, 900" hinzu' },
        { title: 'sizes hinzufügen', description: 'Füge sizes: "(min-width: 750px) 50vw, 100vw" hinzu' },
        { title: 'Testen', description: 'Prüfe im DevTools Network Tab welche Bildgröße geladen wird' }
      ]
    };
  }

  // External Scripts
  if (rec.includes('Script') || rec.includes('extern')) {
    return {
      difficulty: 'mittel',
      timeEstimate: '15-25 Min',
      steps: [
        { title: 'Scripts identifizieren', description: 'Finde alle <script src="https://..."> Tags' },
        { title: 'Kritikalität bewerten', description: 'Welche Scripts sind für die erste Interaktion nötig?' },
        { title: 'async/defer hinzufügen', description: 'Füge async oder defer zu nicht-kritischen Scripts hinzu' },
        { title: 'Lazy Loading', description: 'Lade Chat-Widgets etc. erst nach 3 Sekunden oder User-Interaktion' },
        { title: 'Testen', description: 'Prüfe ob alle Funktionen noch funktionieren' }
      ]
    };
  }

  // Font Optimization
  if (rec.includes('Font') || rec.includes('Schrift')) {
    return {
      difficulty: 'mittel',
      timeEstimate: '15-20 Min',
      steps: [
        { title: 'Font-Einbindung finden', description: 'Suche in layout/theme.liquid nach fonts.googleapis.com' },
        { title: 'display=swap prüfen', description: 'Stelle sicher dass &display=swap in der URL ist' },
        { title: 'preconnect hinzufügen', description: 'Füge <link rel="preconnect" href="https://fonts.gstatic.com"> hinzu' },
        { title: 'Optional: Self-Hosting', description: 'Lade die Fonts herunter und hoste sie selbst', tip: 'Das ist schneller, aber aufwändiger zu pflegen' },
        { title: 'FOIT testen', description: 'Prüfe ob Text beim Laden kurz unsichtbar ist' }
      ]
    };
  }

  // Default guide
  return {
    difficulty: 'mittel',
    timeEstimate: '10-15 Min',
    steps: [
      { title: 'Theme-Editor öffnen', description: 'Onlineshop → Themes → Code bearbeiten' },
      { title: 'Datei finden', description: 'Suche nach der betroffenen Section oder Layout-Datei' },
      { title: 'Problem identifizieren', description: 'Finde die zu optimierende Stelle im Code' },
      { title: 'Code anpassen', description: 'Wende den empfohlenen Fix an', tip: 'Kopiere den Code-Snippet mit dem Button oben' },
      { title: 'Testen', description: 'Im Theme-Preview testen und mit ThemeMetrics erneut analysieren' }
    ]
  };
}

function getShopFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('shop') || '';
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative">
      {label && <p className="text-xs text-muted-foreground mb-2">{label}</p>}
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
      </button>
    </div>
  );
}

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const { authenticatedFetch } = useAppBridge();
  const [shop, setShop] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());
  const [completedRecs, setCompletedRecs] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { canUseCodeFixes, features, plan } = usePlan();
  const codeFixesAllowed = canUseCodeFixes().allowed;

  useEffect(() => {
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopFromUrl() || 'thememetrics-test.myshopify.com';
    setShop(detectedShop);
  }, [searchParams]);

  useEffect(() => {
    if (!shop) return;
    const fetchData = async () => {
      try {
        const response = await authenticatedFetch(`/api/themes/data?shop=${shop}`);
        if (response.ok) {
          const result = await response.json();
          if (result.hasData) setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const saved = localStorage.getItem(`completed-recs-${shop}`);
    if (saved) setCompletedRecs(new Set(JSON.parse(saved)));
  }, [shop]);

  const toggleRec = (id: string) => {
    const newExpanded = new Set(expandedRecs);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRecs(newExpanded);
  };

  const toggleGuide = (id: string) => {
    const newExpanded = new Set(expandedGuides);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedGuides(newExpanded);
  };

  const toggleComplete = (id: string) => {
    const newCompleted = new Set(completedRecs);
    if (newCompleted.has(id)) newCompleted.delete(id);
    else newCompleted.add(id);
    setCompletedRecs(newCompleted);
    localStorage.setItem(`completed-recs-${shop}`, JSON.stringify(Array.from(newCompleted)));
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'einfach': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'mittel': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      default: return 'bg-red-500/10 text-red-600 dark:text-red-400';
    }
  };

  if (loading) {
    return <RecommendationsSkeleton />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-amber-500" />
            Empfehlungen
          </h1>
        </div>
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Noch keine Empfehlungen</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Starte eine Theme-Analyse um personalisierte Empfehlungen zu erhalten.
          </p>
          <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
            <Play className="w-5 h-5" /> Zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const allSections: Section[] = Object.values(data.analysis?.categorizedSections || {}).flat() as Section[];
  
  interface RecItem {
    id: string;
    text: string;
    section: string;
    sectionScore: number;
    priority: 'high' | 'medium' | 'low';
    hasFix: boolean;
  }
  
  const allRecs: RecItem[] = [];
  allSections.forEach(section => {
    section.recommendations?.forEach((rec, idx) => {
      const priority = section.performanceScore < 40 ? 'high' : section.performanceScore < 60 ? 'medium' : 'low';
      allRecs.push({
        id: `${section.name}-${idx}`,
        text: rec,
        section: section.name,
        sectionScore: section.performanceScore,
        priority,
        hasFix: !!CODE_FIXES[rec]
      });
    });
  });

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  let sortedRecs = [...allRecs].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  if (filterPriority) sortedRecs = sortedRecs.filter(r => r.priority === filterPriority);

  const highCount = allRecs.filter(r => r.priority === 'high').length;
  const mediumCount = allRecs.filter(r => r.priority === 'medium').length;
  const lowCount = allRecs.filter(r => r.priority === 'low').length;
  const completedCount = completedRecs.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Lightbulb className="w-7 h-7 text-amber-500" />
          Empfehlungen
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalisierte Optimierungsvorschläge für {data.theme?.name || 'dein Theme'}
        </p>
      </div>

      {/* Why Section */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">So funktionieren die Empfehlungen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-card/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">🎯 Priorisiert</p>
                <p className="text-muted-foreground">Hohe Priorität = größter Impact</p>
              </div>
              <div className="bg-card/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">📋 Step-by-Step</p>
                <p className="text-muted-foreground">Jede Empfehlung hat eine Anleitung</p>
              </div>
              <div className="bg-card/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">✅ Trackbar</p>
                <p className="text-muted-foreground">Markiere erledigte Fixes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Gesamt</span>
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-4xl font-bold text-foreground">{allRecs.length}</span>
        </div>

        <button onClick={() => setFilterPriority(filterPriority === 'high' ? null : 'high')}
          className={`bg-card rounded-2xl border p-5 text-left transition-all ${filterPriority === 'high' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-border hover:border-red-500/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Hoch</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-4xl font-bold text-red-500">{highCount}</span>
        </button>

        <button onClick={() => setFilterPriority(filterPriority === 'medium' ? null : 'medium')}
          className={`bg-card rounded-2xl border p-5 text-left transition-all ${filterPriority === 'medium' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border hover:border-amber-500/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Mittel</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-4xl font-bold text-amber-500">{mediumCount}</span>
        </button>

        <button onClick={() => setFilterPriority(filterPriority === 'low' ? null : 'low')}
          className={`bg-card rounded-2xl border p-5 text-left transition-all ${filterPriority === 'low' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border hover:border-blue-500/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Nice-to-have</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-4xl font-bold text-blue-500">{lowCount}</span>
        </button>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Erledigt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-4xl font-bold text-emerald-500">{completedCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {completedCount > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Dein Fortschritt</span>
            <span className="text-sm text-muted-foreground">{completedCount} von {allRecs.length} erledigt</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all" style={{ width: `${(completedCount / allRecs.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Quick Wins Banner */}
      {highCount > 0 && !filterPriority && (
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{highCount} Quick Win{highCount > 1 ? 's' : ''} mit großem Impact</h3>
              <p className="text-sm text-muted-foreground">Diese Empfehlungen haben den größten Einfluss.</p>
            </div>
            <button onClick={() => setFilterPriority('high')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
              Jetzt starten
            </button>
          </div>
        </div>
      )}

      {/* Filter indicator */}
      {filterPriority && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Gefiltert nach: <strong className="text-foreground">{filterPriority === 'high' ? 'Hohe Priorität' : filterPriority === 'medium' ? 'Mittel' : 'Nice-to-have'}</strong></span>
          <button onClick={() => setFilterPriority(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" /> Zurücksetzen
          </button>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-3">
        {sortedRecs.map(rec => {
          const fix = CODE_FIXES[rec.text];
          const guide = getStepGuide(rec.text);
          const isExpanded = expandedRecs.has(rec.id);
          const isGuideExpanded = expandedGuides.has(rec.id);
          const isCompleted = completedRecs.has(rec.id);
          const borderColor = rec.priority === 'high' ? 'border-l-red-500' : rec.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500';

          return (
            <div key={rec.id} className={`bg-card rounded-xl border border-border border-l-4 ${borderColor} overflow-hidden ${isCompleted ? 'opacity-60' : ''}`}>
              <div className="p-4 flex items-start gap-3">
                <button onClick={() => toggleComplete(rec.id)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted hover:border-muted-foreground'}`}>
                  {isCompleted && <Check className="w-3 h-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className={`font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>{rec.text}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-secondary rounded text-muted-foreground">{rec.section}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${rec.sectionScore < 40 ? 'bg-red-500/10 text-red-500' : rec.sectionScore < 60 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          Score: {rec.sectionScore}
                        </span>
                        {fix && <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">Code-Fix</span>}
                      </div>
                    </div>
                    {!isCompleted && (
                      <button onClick={() => toggleRec(rec.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium">
                        {isExpanded ? 'Weniger' : 'Fix anzeigen'}
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && !isCompleted && (
                <div className="border-t border-border bg-secondary/30 p-4 space-y-4">
                  {fix ? (
                    codeFixesAllowed ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-foreground mb-1">{fix.title}</h4>
                          <p className="text-sm text-muted-foreground">{fix.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-secondary rounded text-muted-foreground">📁 {fix.file}</span>
                          {fix.lineHint && <span className="text-muted-foreground">{fix.lineHint}</span>}
                        </div>
                        {fix.codeBefore && <CodeBlock code={fix.codeBefore} label="❌ Vorher:" />}
                        <CodeBlock code={fix.codeAfter} label="✅ Nachher:" />
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                          <p className="text-sm text-amber-700 dark:text-amber-300">💡 {fix.explanation}</p>
                        </div>
                      </div>
                    ) : (
                      /* Code Fix Locked for Free/Starter */
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/80 to-card z-10 flex items-center justify-center">
                          <div className="text-center p-6">
                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h4 className="font-semibold text-foreground mb-2">Code-Fixes freischalten</h4>
                            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                              Erhalte Copy-Paste fertigen Code für alle Optimierungen mit dem Pro Plan.
                            </p>
                            <button
                              onClick={() => setShowUpgradeModal(true)}
                              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all inline-flex items-center gap-2"
                            >
                              <Crown className="w-4 h-4" />
                              Upgrade auf Pro
                            </button>
                          </div>
                        </div>
                        {/* Blurred preview */}
                        <div className="opacity-30 blur-sm pointer-events-none select-none">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-foreground mb-1">{fix.title}</h4>
                              <p className="text-sm text-muted-foreground">{fix.description}</p>
                            </div>
                            <div className="bg-secondary rounded-lg p-3 font-mono text-xs text-muted-foreground">
                              {'// Code-Fix Preview...\n{{ section.settings.image | image_url... }}'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Für diese Empfehlung gibt es noch keinen automatischen Code-Fix. Nutze die Schritt-für-Schritt Anleitung.</p>
                  )}

                  <div className="border border-indigo-500/20 rounded-xl overflow-hidden">
                    <button onClick={() => toggleGuide(rec.id)} className="w-full flex items-center justify-between p-4 bg-indigo-500/5 hover:bg-indigo-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                          <ListOrdered className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">Schritt-für-Schritt Anleitung</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(guide.difficulty)}`}>
                              {guide.difficulty === 'einfach' ? '🟢' : guide.difficulty === 'mittel' ? '🟡' : '🔴'} {guide.difficulty}
                            </span>
                            <span className="text-xs text-muted-foreground">⏱️ {guide.timeEstimate}</span>
                          </div>
                        </div>
                      </div>
                      {isGuideExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    {isGuideExpanded && (
                      <div className="p-4 space-y-3 border-t border-indigo-500/20">
                        {guide.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</div>
                            <div className="flex-1 pt-0.5">
                              <p className="font-medium text-foreground">{step.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                              {step.tip && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 bg-amber-500/10 px-2 py-1 rounded inline-block">💡 {step.tip}</p>}
                            </div>
                          </div>
                        ))}
                        <div className="pt-3 border-t border-border">
                          <a href={`https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/themes/current/editor`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                            Theme-Editor öffnen <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sortedRecs.length === 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Alles erledigt!</h3>
            <p className="text-muted-foreground">{filterPriority ? 'Keine Empfehlungen mit dieser Priorität.' : 'Du hast alle Empfehlungen abgearbeitet.'}</p>
          </div>
        )}
      </div>

      {data.theme?.analyzedAt && (
        <p className="text-sm text-muted-foreground text-center">Basierend auf Analyse vom {new Date(data.theme.analyzedAt).toLocaleString('de-DE')}</p>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Code-Fixes"
        reason="Copy-Paste fertiger Code für alle Optimierungen ist ab dem Pro Plan verfügbar."
        recommendedPlan="pro"
        shop={shop}
      />
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <RecommendationsContent />
    </Suspense>
  );
}
