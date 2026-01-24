'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { 
  ArrowLeft, 
  Image as ImageIcon,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  FileImage,
  Layers,
  Zap,
  HardDrive,
  Clock,
  TrendingUp,
  Smartphone,
  Globe,
  Code
} from 'lucide-react';

function ImageInfoContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link 
          href={`/dashboard/images?shop=${shop}`} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Image Optimization
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-indigo-600" />
          Wie wird der Image Score berechnet?
        </h1>
        <p className="text-muted-foreground mt-2">
          Transparente Erklärung unserer Bildoptimierungs-Analyse
        </p>
      </div>

      {/* Why Images Matter */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Warum Bildoptimierung wichtig ist
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-3xl font-bold text-indigo-600">60-80%</p>
            <p className="text-sm text-muted-foreground">der Seitengröße sind Bilder</p>
          </div>
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-3xl font-bold text-indigo-600">-7%</p>
            <p className="text-sm text-muted-foreground">Conversion pro Sekunde Verzögerung</p>
          </div>
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-3xl font-bold text-indigo-600">53%</p>
            <p className="text-sm text-muted-foreground">verlassen Seiten die &gt;3s laden</p>
          </div>
        </div>
      </div>

      {/* Mobile Context */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile-Nutzer im Fokus
        </h2>
        <p className="text-amber-800">
          <strong>70%+ deiner Besucher</strong> kommen über mobile Geräte. 
          Auf 3G/LTE-Verbindungen dauert ein 5MB Bild über <strong>1.5 Sekunden</strong> zum Laden.
          Das ist zu lang – Google und deine Kunden erwarten schnellere Seiten.
        </p>
      </div>

      {/* Score Formula */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Score-Berechnung
        </h2>
        
        <div className="bg-slate-900 rounded-xl p-6 text-center mb-6">
          <code className="text-emerald-400 text-lg">
            Score = 100 - (Kritisch × 15) - (Hoch × 8) - (Mittel × 4) - (Niedrig × 1)
          </code>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-700">Kritisch</span>
            </div>
            <p className="text-red-600 text-2xl font-bold">-15 Punkte</p>
            <p className="text-sm text-red-600 mt-1">
              z.B. Bild in "master" Größe
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-orange-700">Hoch</span>
            </div>
            <p className="text-orange-600 text-2xl font-bold">-8 Punkte</p>
            <p className="text-sm text-orange-600 mt-1">
              z.B. Kein WebP Format
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-700">Mittel</span>
            </div>
            <p className="text-amber-600 text-2xl font-bold">-4 Punkte</p>
            <p className="text-sm text-amber-600 mt-1">
              z.B. Kein Lazy Loading
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-700">Niedrig</span>
            </div>
            <p className="text-blue-600 text-2xl font-bold">-1 Punkt</p>
            <p className="text-sm text-blue-600 mt-1">
              z.B. Fehlende sizes
            </p>
          </div>
        </div>
      </div>

      {/* Score Ranges */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Score-Bewertung</h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">90+</span>
            </div>
            <div>
              <p className="font-semibold text-emerald-700">Exzellent</p>
              <p className="text-sm text-emerald-600">Deine Bilder sind optimal optimiert. Kaum Verbesserungspotenzial.</p>
            </div>
            <CheckCircle className="w-6 h-6 text-emerald-500 ml-auto" />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-green-600">70-89</span>
            </div>
            <div>
              <p className="font-semibold text-green-700">Gut</p>
              <p className="text-sm text-green-600">Kleine Optimierungen möglich. Fokussiere dich auf die "Hoch" Prioritäten.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">50-69</span>
            </div>
            <div>
              <p className="font-semibold text-amber-700">Verbesserungswürdig</p>
              <p className="text-sm text-amber-600">Signifikantes Einsparpotenzial. Deine Seite könnte deutlich schneller sein.</p>
            </div>
            <AlertCircle className="w-6 h-6 text-amber-500 ml-auto" />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-red-600">0-49</span>
            </div>
            <div>
              <p className="font-semibold text-red-700">Kritisch</p>
              <p className="text-sm text-red-600">Bilder bremsen deinen Shop massiv. Sofortige Optimierung empfohlen.</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-500 ml-auto" />
          </div>
        </div>
      </div>

      {/* What We Check */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Was wir prüfen</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileImage className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground">Format</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">●</span>
                <span><strong>WebP Format:</strong> 25-35% kleiner als JPEG</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">●</span>
                <span><strong>Hardcoded Formate:</strong> .jpg/.png statt dynamisch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">●</span>
                <span><strong>Falsches Format:</strong> Foto als PNG etc.</span>
              </li>
            </ul>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground">Größe</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">●</span>
                <span><strong>"master" Größe:</strong> Lädt Originalbild (oft 5MB+)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">●</span>
                <span><strong>Überdimensioniert:</strong> 4000px für 400px Container</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">●</span>
                <span><strong>Kein srcset:</strong> Gleiches Bild für alle Geräte</span>
              </li>
            </ul>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-foreground">Laden</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">●</span>
                <span><strong>Hero lazy-loaded:</strong> Wichtigstes Bild verzögert</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">●</span>
                <span><strong>Kein Lazy Loading:</strong> Alle Bilder sofort laden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">●</span>
                <span><strong>Fehlende Dimensionen:</strong> Verursacht CLS</span>
              </li>
            </ul>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground">Shopify-spezifisch</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">●</span>
                <span><strong>img_url statt image_url:</strong> Veralteter Filter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">●</span>
                <span><strong>Externe Bilder:</strong> Nicht über Shopify CDN</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">●</span>
                <span><strong>asset_url für Bilder:</strong> Keine Optimierung</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-600" />
          Shopify Best Practices
        </h2>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-xl p-4">
            <p className="font-medium text-foreground mb-2">✅ Optimales Bild-Tag</p>
            <pre className="text-xs bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto">
{`<img
  src="{{ image | image_url: width: 800, format: 'webp' }}"
  srcset="
    {{ image | image_url: width: 400 }} 400w,
    {{ image | image_url: width: 800 }} 800w,
    {{ image | image_url: width: 1200 }} 1200w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  loading="lazy"
  width="800"
  height="600"
  alt="{{ image.alt | escape }}"
>`}</pre>
          </div>
          
          <div className="bg-muted rounded-xl p-4">
            <p className="font-medium text-foreground mb-2">✅ Hero-Bild (Above-the-fold)</p>
            <pre className="text-xs bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto">
{`{%- comment -%} Preload für LCP {%- endcomment -%}
<link
  rel="preload"
  as="image"
  href="{{ section.settings.image | image_url: width: 1200 }}"
  fetchpriority="high"
>

<img
  src="{{ section.settings.image | image_url: width: 1200 }}"
  loading="eager"
  fetchpriority="high"
  width="1200"
  height="600"
>`}</pre>
          </div>
        </div>
      </div>

      {/* Savings Calculation */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Wie wir Einsparungen berechnen
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-foreground mb-2">Datengröße</h3>
            <p className="text-sm text-muted-foreground">
              Wir schätzen die Einsparung basierend auf typischen Kompressionsraten:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• WebP statt JPEG: <strong>~30% kleiner</strong></li>
              <li>• Richtige Größe statt "master": <strong>~70% kleiner</strong></li>
              <li>• srcset für Mobile: <strong>~40% kleiner</strong></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-2">Ladezeit</h3>
            <p className="text-sm text-muted-foreground">
              Wir rechnen mit durchschnittlicher mobiler Bandbreite:
            </p>
            <div className="bg-muted rounded-lg p-3 mt-2">
              <code className="text-xs text-foreground">
                Zeitersparnis = Datenersparnis ÷ 3 MB/s
              </code>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              3 MB/s entspricht einem Mix aus 3G und LTE Verbindungen.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Bereit für schnellere Bilder?</h2>
        <p className="text-indigo-100 mb-6">
          Starte die Analyse und finde heraus, wie viel schneller dein Shop sein könnte.
        </p>
        <Link
          href={`/dashboard/images?shop=${shop}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
          Zur Image Optimization
        </Link>
      </div>
    </div>
  );
}

export default function ImageInfoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <ImageInfoContent />
    </Suspense>
  );
}
