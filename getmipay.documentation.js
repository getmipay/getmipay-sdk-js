const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, Header, TabStopType, TabStopPosition,
  TableOfContents
} = require('docx');
const fs = require('fs');

// ─── Color palette ───────────────────────────────────────────────
const BLUE_DARK   = "1A3C6E";
const BLUE_MED    = "2563A8";
const BLUE_LIGHT  = "D6E4F5";
const BLUE_PALE   = "EDF4FC";
const GRAY_DARK   = "374151";
const GRAY_MED    = "6B7280";
const GRAY_LIGHT  = "F3F4F6";
const GREEN_DARK  = "166534";
const GREEN_BG    = "DCFCE7";
const RED_DARK    = "991B1B";
const RED_BG      = "FEE2E2";
const AMBER_DARK  = "92400E";
const AMBER_BG    = "FEF3C7";
const WHITE       = "FFFFFF";

// ─── Border helpers ──────────────────────────────────────────────
const border = (color = "CCCCCC", size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: WHITE });
const allBorders = (color, size) => ({ top: border(color, size), bottom: border(color, size), left: border(color, size), right: border(color, size) });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

// ─── Paragraph helpers ───────────────────────────────────────────
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_MED, space: 6 } },
  children: [new TextRun({ text, bold: true, color: BLUE_DARK, font: "Arial", size: 36 })]
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 320, after: 160 },
  children: [new TextRun({ text, bold: true, color: BLUE_MED, font: "Arial", size: 28 })]
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, color: GRAY_DARK, font: "Arial", size: 24 })]
});

const para = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 100 },
  children: [new TextRun({ text, font: "Arial", size: 22, color: GRAY_DARK, ...opts })]
});

const paraRuns = (runs) => new Paragraph({
  spacing: { before: 80, after: 100 },
  children: runs
});

const run = (text, opts = {}) => new TextRun({ text, font: "Arial", size: 22, color: GRAY_DARK, ...opts });
const runBold = (text, color = GRAY_DARK) => new TextRun({ text, font: "Arial", size: 22, bold: true, color });
const runCode = (text) => new TextRun({ text, font: "Courier New", size: 20, color: BLUE_DARK, highlight: "cyan" });
const runMono = (text) => new TextRun({ text, font: "Courier New", size: 20, color: "1e1e1e" });

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { before: 60, after: 60 },
  children: [new TextRun({ text, font: "Arial", size: 22, color: GRAY_DARK })]
});

const bulletRuns = (runs, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { before: 60, after: 60 },
  children: runs
});

const numbered = (text, level = 0) => new Paragraph({
  numbering: { reference: "numbers", level },
  spacing: { before: 60, after: 60 },
  children: [new TextRun({ text, font: "Arial", size: 22, color: GRAY_DARK })]
});

const spacer = (size = 200) => new Paragraph({ spacing: { before: size, after: 0 }, children: [new TextRun("")] });

const pageBreak = () => new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] });

// ─── Code block (shaded table) ───────────────────────────────────
const codeBlock = (lines) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  borders: { ...allBorders("C8D8F0", 4), insideH: noBorder(), insideV: noBorder() },
  rows: [new TableRow({
    children: [new TableCell({
      shading: { fill: "1E293B", type: ShadingType.CLEAR },
      borders: noBorders(),
      margins: { top: 160, bottom: 160, left: 240, right: 240 },
      width: { size: 9360, type: WidthType.DXA },
      children: lines.map(l => new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: l, font: "Courier New", size: 18, color: "E2E8F0" })]
      }))
    })]
  })]
});

// ─── Info box ─────────────────────────────────────────────────────
const infoBox = (title, text, bgColor = BLUE_PALE, borderColor = BLUE_MED, titleColor = BLUE_DARK) =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: { top: border(borderColor, 8), bottom: border(borderColor, 4), left: border(borderColor, 12), right: border(borderColor, 4), insideH: noBorder(), insideV: noBorder() },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        borders: noBorders(),
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: titleColor })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text, font: "Arial", size: 22, color: GRAY_DARK })] })
        ]
      })]
    })]
  });

// ─── Two-column table helper ─────────────────────────────────────
const twoColTable = (headers, rows, col1 = 3000, col2 = 6360) => {
  const total = col1 + col2;
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      shading: { fill: BLUE_DARK, type: ShadingType.CLEAR },
      borders: noBorders(),
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      width: { size: i === 0 ? col1 : col2, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: WHITE })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      shading: { fill: ri % 2 === 0 ? WHITE : GRAY_LIGHT, type: ShadingType.CLEAR },
      borders: { top: border("E5E7EB", 2), bottom: border("E5E7EB", 2), left: noBorder(), right: noBorder(), insideH: noBorder(), insideV: noBorder() },
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      width: { size: ci === 0 ? col1 : col2, type: WidthType.DXA },
      children: [new Paragraph({
        children: Array.isArray(cell)
          ? cell
          : [new TextRun({ text: cell, font: "Arial", size: 20, color: GRAY_DARK })]
      })]
    }))
  }));
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: [col1, col2],
    rows: [headerRow, ...dataRows]
  });
};

// ─── Three-column table ──────────────────────────────────────────
const threeColTable = (headers, rows, widths = [2500, 2000, 4860]) => {
  const total = widths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      shading: { fill: BLUE_DARK, type: ShadingType.CLEAR },
      borders: noBorders(),
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      width: { size: widths[i], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: WHITE })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      shading: { fill: ri % 2 === 0 ? WHITE : GRAY_LIGHT, type: ShadingType.CLEAR },
      borders: { top: border("E5E7EB", 2), bottom: border("E5E7EB", 2), left: noBorder(), right: noBorder(), insideH: noBorder(), insideV: noBorder() },
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      width: { size: widths[ci], type: WidthType.DXA },
      children: [new Paragraph({
        children: Array.isArray(cell)
          ? cell
          : [new TextRun({ text: cell, font: "Arial", size: 20, color: GRAY_DARK })]
      })]
    }))
  }));
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...dataRows]
  });
};

// ═══════════════════════════════════════════════════════════════════
// DOCUMENT CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
      ]}
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: BLUE_DARK },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_MED },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: GRAY_DARK },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Table({
            width: { size: 9720, type: WidthType.DXA },
            columnWidths: [6000, 3720],
            borders: { top: noBorder(), left: noBorder(), right: noBorder(), insideV: noBorder(), insideH: noBorder(),
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MED } },
            rows: [new TableRow({ children: [
              new TableCell({ borders: noBorders(), width: { size: 6000, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Documentation Technique — SDK GetMiPay JavaScript", font: "Arial", size: 18, color: BLUE_MED })] })] }),
              new TableCell({ borders: noBorders(), width: { size: 3720, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "v1.0.0", font: "Arial", size: 18, color: GRAY_MED })] })] })
            ]})]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Table({
            width: { size: 9720, type: WidthType.DXA },
            columnWidths: [6000, 3720],
            borders: { bottom: noBorder(), left: noBorder(), right: noBorder(), insideV: noBorder(), insideH: noBorder(),
              top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } },
            rows: [new TableRow({ children: [
              new TableCell({ borders: noBorders(), width: { size: 6000, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "GetMiPay — Confidentiel", font: "Arial", size: 18, color: GRAY_MED })] })] }),
              new TableCell({ borders: noBorders(), width: { size: 3720, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
                  new TextRun({ text: "Page ", font: "Arial", size: 18, color: GRAY_MED }),
                  new PageNumber({ font: "Arial", size: 18, color: GRAY_MED })
                ]})]})
            ]})]
          })
        ]
      })
    },
    children: [

      // ── PAGE DE COUVERTURE ──────────────────────────────────────
      new Table({
        width: { size: 9720, type: WidthType.DXA },
        columnWidths: [9720],
        borders: { ...allBorders(BLUE_DARK, 8), insideH: noBorder(), insideV: noBorder() },
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: BLUE_DARK, type: ShadingType.CLEAR },
          borders: noBorders(),
          margins: { top: 600, bottom: 600, left: 600, right: 600 },
          width: { size: 9720, type: WidthType.DXA },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 },
              children: [new TextRun({ text: "SDK GetMiPay", font: "Arial", size: 64, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
              children: [new TextRun({ text: "JavaScript / Node.js", font: "Arial", size: 36, color: "93C5FD" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 },
              children: [new TextRun({ text: "Documentation Technique Complète", font: "Arial", size: 28, color: "CBD5E1", italics: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: "Comportement · Tests · Guide de réalisation", font: "Arial", size: 24, color: "94A3B8" })] }),
            spacer(300),
            new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Version 1.0.0  ·  2025  ·  @getmipay/sdk", font: "Arial", size: 20, color: "64748B" })] }),
          ]
        })]})],
      }),

      spacer(600),

      // ── TABLE DES MATIÈRES ──────────────────────────────────────
      h1("Table des matières"),
      new TableOfContents("Table des matières", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // CHAPITRE 1 — VUE D'ENSEMBLE
      // ══════════════════════════════════════════════════════════════
      h1("1. Vue d'ensemble du SDK"),

      h2("1.1 Qu'est-ce que le SDK GetMiPay ?"),
      para("Le SDK GetMiPay est une bibliothèque JavaScript officielle qui permet aux développeurs d'intégrer les fonctionnalités de paiement mobile money de la plateforme GetMiPay dans leurs applications Node.js en quelques lignes de code."),
      para("Sans le SDK, un développeur devrait : construire manuellement les signatures HMAC-SHA256, formater correctement chaque requête HTTP, gérer tous les codes d'erreur HTTP, et maintenir la compatibilité avec les différentes versions de l'API. Le SDK encapsule toute cette complexité."),

      spacer(160),
      infoBox("Objectif principal", "Permettre à un développeur d'initier un paiement mobile money (PayIn) en Afrique de l'Ouest en moins de 10 lignes de code, avec une sécurité de niveau production.", BLUE_PALE, BLUE_MED, BLUE_DARK),
      spacer(160),

      h2("1.2 Architecture générale"),
      para("Le SDK est organisé en 6 couches distinctes, chacune ayant une responsabilité unique et bien définie :"),
      spacer(120),
      twoColTable(
        ["Couche", "Rôle et responsabilité"],
        [
          ["src/index.js", "Point d'entrée unique. Instancie et expose tous les services au développeur."],
          ["src/config.js", "Validation et gestion de la configuration (clé API, environnement, timeout, URL de base)."],
          ["src/auth/signature.js", "Génération de la signature cryptographique HMAC-SHA256 pour chaque requête."],
          ["src/http/client.js", "Communication HTTP avec l'API REST via axios. Gère les codes de réponse et les erreurs réseau."],
          ["src/services/Payments.js", "Logique métier des paiements : orchestration validation → payload → signature → envoi."],
          ["src/models/", "Structures de données : Payment (payload) et Response (réponse normalisée)."],
          ["src/utils/", "Utilitaires transversaux : classes d'erreurs personnalisées et validation des paramètres."],
        ]
      ),

      spacer(200),
      h2("1.3 Flux de données complet"),
      para("Voici le chemin exact qu'emprunte une requête depuis l'appel développeur jusqu'à la réponse finale :"),
      spacer(120),
      infoBox(
        "Étape 1 — Appel développeur",
        "mipay.payments.payin({ amount: 5000, currency: 'XOF', wallet: '+2250700000000', callback_url: 'https://...' })",
        GRAY_LIGHT, "9CA3AF", GRAY_DARK
      ),
      spacer(80),
      infoBox("Étape 2 — Validation (validators.js)", "Vérification des champs obligatoires (amount, currency, wallet, callback_url), format du code devise ISO 4217 (regex /^[A-Z]{3}$/), validité de l'URL callback via new URL(). Si invalide → lève immédiatement une ValidationError sans aucun appel réseau.", BLUE_PALE, BLUE_MED, BLUE_DARK),
      spacer(80),
      infoBox("Étape 3 — Construction du payload (Payment.js)", "new Payment(params) crée un objet structuré avec toutes les valeurs par défaut appliquées sur les champs optionnels (customer_name, customer_email, description → chaîne vide si absent). toJSON() sérialise en objet pur prêt pour l'API.", BLUE_PALE, BLUE_MED, BLUE_DARK),
      spacer(80),
      infoBox("Étape 4 — Génération de la signature (signature.js)", "Signature.getHeaders() capture le timestamp Unix courant, sérialise le body en JSON, calcule HMAC-SHA256(apiKey, 'POST\\n/payments/payin\\n{timestamp}\\n{body}'), et retourne les 7 headers HTTP nécessaires.", AMBER_BG, AMBER_DARK, AMBER_DARK),
      spacer(80),
      infoBox("Étape 5 — Envoi HTTP (client.js)", "axios.post('/payments/payin', payload, { headers }) envoie la requête vers https://sandbox.getmipay.com/v1 (ou production). Timeout de 30 secondes. En cas d'erreur réseau ou HTTP 4xx/5xx → lève une ApiError.", GRAY_LIGHT, "9CA3AF", GRAY_DARK),
      spacer(80),
      infoBox("Étape 6 — Normalisation de la réponse (Response.js)", "new Response(data) encapsule la réponse brute de l'API dans un modèle structuré avec les méthodes isSuccess(), isPending(), isFailed(). Le développeur reçoit un objet propre et typé.", GREEN_BG, "16A34A", GREEN_DARK),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // CHAPITRE 2 — COMPORTEMENT DÉTAILLÉ PAR FICHIER
      // ══════════════════════════════════════════════════════════════
      h1("2. Comportement détaillé de chaque fichier"),

      h2("2.1 src/config.js — Configuration"),
      para("Ce fichier est le premier exécuté lors de la création d'une instance GetMiPay. Il applique la priorité suivante pour la clé API :"),
      bullet("Priorité 1 : option apiKey passée au constructeur"),
      bullet("Priorité 2 : variable d'environnement process.env.GMP_API_KEY"),
      bullet("Si aucune des deux n'est définie → validate() lèvera une erreur"),
      spacer(120),
      para("La méthode validate() est appelée immédiatement dans le constructeur de GetMiPay. Cela garantit qu'une mauvaise configuration est détectée dès l'instanciation, pas au moment du premier appel API."),
      spacer(120),
      twoColTable(
        ["Propriété", "Valeur et comportement"],
        [
          ["apiKey", "Clé secrète. Ne quitte jamais le process — uniquement transmise dans les headers HTTP signés."],
          ["environment", "'sandbox' par défaut. Détermine l'URL de base utilisée pour toutes les requêtes."],
          ["baseUrl (sandbox)", "https://sandbox.getmipay.com/v1 — serveur de test, transactions fictives."],
          ["baseUrl (production)", "https://api.getmipay.com/v1 — serveur réel, transactions réelles et facturées."],
          ["timeout", "30000ms par défaut. Après ce délai, axios annule la requête → ApiError avec statusCode 0."],
          ["version", "'1.0.0' — injectée dans le header x-sdk-version pour le suivi API côté GetMiPay."],
        ]
      ),

      spacer(200),
      h2("2.2 src/auth/signature.js — Sécurité HMAC-SHA256"),
      para("C'est le composant de sécurité du SDK. Chaque requête vers l'API GetMiPay doit être signée pour prouver son authenticité et prévenir les attaques par rejeu (replay attacks)."),
      spacer(120),
      para("La chaîne signée est construite comme suit :"),
      spacer(80),
      codeBlock([
        "stringToSign = METHOD + '\\n' + PATH + '\\n' + TIMESTAMP + '\\n' + BODY",
        "",
        "Exemple pour un PayIn :",
        "POST",
        "/payments/payin",
        "1700000000",
        "{\"amount\":5000,\"currency\":\"XOF\",\"wallet\":\"+2250700000000\",...}",
      ]),
      spacer(160),
      para("Le timestamp Unix est capturé à l'instant exact de la construction des headers (Math.floor(Date.now() / 1000)). L'API GetMiPay rejette toute requête dont le timestamp est trop éloigné du temps serveur, empêchant ainsi la réutilisation d'une requête interceptée."),
      spacer(120),
      infoBox("Sécurité : pourquoi le body est inclus dans la signature ?", "Si seuls la méthode et le chemin étaient signés, un attaquant interceptant la requête pourrait modifier le montant ou le numéro de portefeuille. En incluant le body dans la signature, toute modification rend la signature invalide — l'API rejette la requête avec HTTP 401.", RED_BG, RED_DARK, RED_DARK),

      spacer(200),
      h2("2.3 src/http/client.js — Communication HTTP"),
      para("Le client HTTP encapsule axios et normalise toutes les réponses et erreurs. Il distingue trois types de situations d'erreur :"),
      spacer(120),
      threeColTable(
        ["Situation", "Code HTTP", "Comportement SDK"],
        [
          ["Réponse API avec erreur", "4xx ou 5xx", "ApiError avec le message de l'API et le statusCode exact (401, 422, 500...)."],
          ["Aucune réponse reçue", "0", "ApiError : 'No response received from API. Check your network.' Timeout ou coupure réseau."],
          ["Erreur de configuration axios", "0", "ApiError avec le message d'erreur interne d'axios."],
        ]
      ),
      spacer(160),
      para("La méthode _handleError() est privée (convention underscore) — elle n'est jamais appelée directement par le développeur. Elle est invoquée dans les blocs catch des méthodes post() et get()."),

      spacer(200),
      h2("2.4 src/services/Payments.js — Orchestration des paiements"),
      para("C'est le fichier central que le développeur utilise directement. Il orchestre la séquence complète : validation → modèle → signature → HTTP → réponse."),
      spacer(120),
      h3("Méthode payin()"),
      para("Séquence d'exécution interne, dans l'ordre strict :"),
      numbered("validatePayinParams(params) — validation complète des paramètres"),
      numbered("new Payment(params) — construction du payload structuré"),
      numbered("payment.toJSON() — sérialisation en objet JSON pur"),
      numbered("Signature.getHeaders(apiKey, 'POST', '/payments/payin', payload) — headers signés"),
      numbered("this.http.post('/payments/payin', payload, headers) — requête HTTP"),
      numbered("new Response(data) — encapsulation de la réponse"),
      spacer(120),
      h3("Méthode getStatus()"),
      para("Permet de vérifier l'état d'un paiement après sa création. Utilisée notamment pour le polling ou la vérification manuelle après réception d'un webhook. Le path contient la référence : /payments/{reference}/status."),
      spacer(120),
      infoBox("Pourquoi deux méthodes distinctes ?", "payin() crée une transaction (méthode POST avec body signé). getStatus() consulte l'état existant (méthode GET sans body). La distinction est importante pour la génération de la signature : un GET n'a pas de body, donc bodyStr = '' dans la chaîne signée.", BLUE_PALE, BLUE_MED, BLUE_DARK),

      spacer(200),
      h2("2.5 src/utils/errors.js — Hiérarchie des erreurs"),
      para("Le SDK définit deux classes d'erreurs héritant de Error natif. Cette distinction permet au développeur d'adapter sa gestion d'erreur précisément :"),
      spacer(120),
      twoColTable(
        ["Classe", "Quand est-elle levée ?"],
        [
          ["ValidationError", "Paramètre manquant, montant négatif, code devise invalide, URL malformée. Levée AVANT tout appel réseau — indique un bug dans le code appelant."],
          ["ApiError", "Réponse HTTP d'erreur (401, 422, 500), timeout réseau, connexion refusée. Levée APRÈS l'appel réseau — indique un problème serveur ou réseau."],
        ]
      ),
      spacer(160),
      codeBlock([
        "// Gestion recommandée dans le code du développeur :",
        "try {",
        "  const payment = await mipay.payments.payin(params);",
        "} catch (error) {",
        "  if (error.name === 'ValidationError') {",
        "    // Bug dans le code → corriger les paramètres",
        "    console.error('Paramètre invalide:', error.message);",
        "  } else if (error.name === 'ApiError') {",
        "    // Problème serveur/réseau → retry ou alerte",
        "    console.error('Erreur API:', error.message, 'HTTP:', error.statusCode);",
        "  }",
        "}",
      ]),

      spacer(200),
      h2("2.6 src/models/ — Modèles de données"),
      h3("Payment.js"),
      para("Garantit que le payload envoyé à l'API est toujours complet et bien formé, même si le développeur n'a pas fourni les champs optionnels. Les champs customer_name, customer_email et description sont systématiquement présents dans le payload avec une chaîne vide comme valeur par défaut."),
      spacer(120),
      h3("Response.js"),
      para("Encapsule la réponse brute de l'API dans un objet structuré. Expose trois méthodes booléennes — isSuccess(), isPending(), isFailed() — pour permettre au développeur de réagir à l'état du paiement sans hard-coder les chaînes de statut. La propriété raw conserve la réponse complète de l'API pour accéder aux champs supplémentaires non documentés."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // CHAPITRE 3 — GUIDE DE TESTS
      // ══════════════════════════════════════════════════════════════
      h1("3. Guide complet des tests"),

      h2("3.1 Stratégie de test"),
      para("Le SDK adopte une stratégie en trois niveaux :"),
      spacer(120),
      twoColTable(
        ["Niveau", "Description et couverture"],
        [
          ["Tests unitaires (Jest)", "Testent chaque module isolément. Le réseau est simulé (mocké). Couvrent : génération de signature, validation des paramètres, gestion des erreurs, construction du payload."],
          ["Tests d'intégration sandbox", "Testent le SDK contre l'API sandbox réelle de GetMiPay. Nécessitent une clé API sandbox valide. Vérifient le comportement de bout en bout."],
          ["Tests manuels (exemples)", "Exécution des fichiers examples/ pour une vérification visuelle rapide. Utile lors du développement."],
        ]
      ),

      spacer(200),
      h2("3.2 Prérequis : installation de l'environnement de test"),
      para("Avant tout test, installer les dépendances :"),
      spacer(80),
      codeBlock([
        "# 1. Cloner le projet",
        "git clone https://github.com/getmipay/getmipay-sdk-js.git",
        "cd getmipay-sdk-js",
        "",
        "# 2. Installer toutes les dépendances (axios + jest + typescript + @types/node)",
        "npm install",
        "",
        "# 3. Vérifier que Jest est bien installé",
        "npx jest --version",
        "# Doit afficher : 29.x.x",
      ]),

      spacer(200),
      h2("3.3 Lancer les tests unitaires"),

      h3("Commande de base"),
      codeBlock([
        "# Lancer tous les tests",
        "npm test",
        "",
        "# Lancer un fichier de test spécifique",
        "npx jest tests/auth.test.js",
        "npx jest tests/payments.test.js",
        "",
        "# Mode watch (relance automatiquement à chaque modification)",
        "npx jest --watch",
        "",
        "# Avec rapport de couverture de code",
        "npx jest --coverage",
      ]),

      spacer(160),
      h3("Résultat attendu après npm test"),
      codeBlock([
        "PASS tests/auth.test.js",
        "  Signature",
        "    generate()",
        "      ✓ doit retourner une chaîne hexadécimale non vide (5ms)",
        "      ✓ doit produire la même signature pour les mêmes entrées (déterministe) (1ms)",
        "      ✓ doit produire des signatures différentes si le timestamp change (1ms)",
        "      ✓ doit produire des signatures différentes si la clé API change (1ms)",
        "      ✓ doit accepter un body vide (requêtes GET) (1ms)",
        "      ✓ doit correspondre à un calcul HMAC-SHA256 manuel (2ms)",
        "    getHeaders()",
        "      ✓ doit retourner tous les headers requis (2ms)",
        "      ✓ doit inclure la clé API dans le header x-api-key (1ms)",
        "      ✓ doit générer un timestamp numérique récent (Unix secondes) (1ms)",
        "      ✓ doit générer une signature hex valide dans x-signature (1ms)",
        "      ✓ doit gérer un body vide pour les requêtes GET (1ms)",
        "",
        "PASS tests/payments.test.js",
        "  Payments Service",
        "    payin()",
        "      ✓ doit initier un paiement avec des paramètres valides (8ms)",
        "      ✓ doit retourner un objet Response avec les méthodes utilitaires (3ms)",
        "      ✓ doit lever ValidationError si 'amount' est absent (2ms)",
        "      ✓ doit lever ValidationError si 'currency' est absent (1ms)",
        "      ✓ doit lever ValidationError si 'wallet' est absent (1ms)",
        "      ✓ doit lever ValidationError si 'callback_url' est absent (1ms)",
        "      ✓ doit lever ValidationError si 'amount' est négatif (1ms)",
        "      ✓ doit lever ValidationError si 'currency' n'est pas un code ISO valide (1ms)",
        "      ✓ doit lever ValidationError si 'callback_url' est une URL invalide (1ms)",
        "      ✓ doit fonctionner sans les champs optionnels (2ms)",
        "    getStatus()",
        "      ✓ doit retourner le statut d'un paiement existant (2ms)",
        "      ✓ doit lever ValidationError si la référence est absente (1ms)",
        "      ✓ doit lever ValidationError si la référence est undefined (1ms)",
        "    Configuration",
        "      ✓ doit lever une erreur si la clé API est absente (3ms)",
        "      ✓ doit lever une erreur si l'environnement est invalide (2ms)",
        "",
        "Test Suites: 2 passed, 2 total",
        "Tests:       26 passed, 26 total",
        "Time:        1.847s",
      ]),

      spacer(200),
      h2("3.4 Comprendre le mock axios dans les tests"),
      para("Les tests unitaires ne font jamais de vraies requêtes réseau. Axios est mocké (simulé) grâce à jest.mock('axios'). Voici comment fonctionne ce mécanisme :"),
      spacer(80),
      codeBlock([
        "// En haut du fichier tests/payments.test.js :",
        "jest.mock('axios');         // Jest intercepte tous les require('axios')",
        "const axios = require('axios');",
        "",
        "// Dans beforeEach() — avant chaque test :",
        "axios.create.mockReturnValue({",
        "  post: jest.fn().mockResolvedValue({ data: MOCK_PAYIN_RESPONSE }),",
        "  get:  jest.fn().mockResolvedValue({ data: MOCK_PAYIN_RESPONSE }),",
        "});",
        "",
        "// Résultat : quand le SDK appelle axios.create().post(...),",
        "// il reçoit immédiatement MOCK_PAYIN_RESPONSE sans aucun appel réseau.",
      ]),
      spacer(160),
      infoBox("Pourquoi mocker axios ?", "1. Vitesse : les tests s'exécutent en < 2 secondes sans attendre le réseau.  2. Fiabilité : les tests ne dépendent pas de la disponibilité de l'API sandbox.  3. Isolation : on teste uniquement la logique du SDK, pas l'API distante.  4. Reproductibilité : même résultat à chaque exécution, en CI/CD comme en local.", BLUE_PALE, BLUE_MED, BLUE_DARK),

      spacer(200),
      h2("3.5 Tests d'intégration avec l'API sandbox"),
      para("Ces tests effectuent de vraies requêtes HTTP vers le serveur sandbox GetMiPay. Ils nécessitent une clé API sandbox valide."),
      spacer(80),
      codeBlock([
        "# Définir la clé API en variable d'environnement",
        "export GMP_API_KEY=gmp_sk_test_xxxxxxxxxxxx",
        "",
        "# Lancer l'exemple de paiement",
        "node examples/basic-payin.js",
      ]),
      spacer(120),
      para("Résultat attendu sur la console :"),
      spacer(80),
      codeBlock([
        "Démarrage du paiement test...",
        "",
        "✅ Paiement initié avec succès !",
        "-----------------------------------",
        "Référence : GMP-TEST-001",
        "Statut    : pending",
        "Montant   : 5000 XOF",
        "Créé le   : 2025-01-15T10:30:00Z",
        "-----------------------------------",
        "",
        "⏳ Le paiement est en attente de traitement par l'opérateur.",
      ]),

      spacer(200),
      h2("3.6 Tests manuels par scénario"),
      h3("Scénario 1 — Paramètre manquant"),
      codeBlock([
        "// Créer un fichier test-manual.js",
        "const { GetMiPay } = require('./src/index');",
        "",
        "const mipay = new GetMiPay({ apiKey: 'gmp_sk_test_xxx', environment: 'sandbox' });",
        "",
        "// Test : oublier le callback_url",
        "mipay.payments.payin({",
        "  amount: 5000,",
        "  currency: 'XOF',",
        "  wallet: '+2250700000000'",
        "  // callback_url manquant intentionnellement",
        "}).catch(err => {",
        "  console.log('Erreur type  :', err.name);    // ValidationError",
        "  console.log('Erreur msg   :', err.message); // Missing required field: \"callback_url\"",
        "});",
      ]),
      spacer(120),
      h3("Scénario 2 — Clé API invalide"),
      codeBlock([
        "// Mauvaise clé API → doit retourner HTTP 401",
        "const mipay = new GetMiPay({ apiKey: 'cle_invalide', environment: 'sandbox' });",
        "",
        "mipay.payments.payin({ ... }).catch(err => {",
        "  console.log('Erreur type  :', err.name);        // ApiError",
        "  console.log('Code HTTP    :', err.statusCode);  // 401",
        "});",
      ]),
      spacer(120),
      h3("Scénario 3 — Environnement invalide"),
      codeBlock([
        "// Environnement inexistant → erreur immédiate au constructeur",
        "try {",
        "  const mipay = new GetMiPay({",
        "    apiKey: 'gmp_sk_test_xxx',",
        "    environment: 'staging'  // invalide",
        "  });",
        "} catch (err) {",
        "  console.log(err.message); // Environment must be \"sandbox\" or \"production\"",
        "}",
      ]),
      spacer(120),
      h3("Scénario 4 — Test du webhook"),
      codeBlock([
        "# Terminal 1 : démarrer le serveur webhook",
        "node examples/webhook-handler.js",
        "# → Webhook handler démarré sur http://localhost:3000/webhook",
        "",
        "# Terminal 2 : simuler un webhook GetMiPay avec curl",
        "curl -X POST http://localhost:3000/webhook \\",
        "  -H 'Content-Type: application/json' \\",
        "  -d '{\"reference\":\"GMP-001\",\"status\":\"success\",\"amount\":5000,\"currency\":\"XOF\"}'",
        "",
        "# Terminal 1 affiche :",
        "# 📩 Webhook reçu de GetMiPay :",
        "# Référence : GMP-001",
        "# Statut    : success",
        "# ✅ Paiement réussi → activer le service pour le client.",
      ]),

      spacer(200),
      h2("3.7 Vérification du packaging npm"),
      codeBlock([
        "# Simuler la publication sans publier réellement",
        "npm pack",
        "# Crée : getmipay-sdk-1.0.0.tgz",
        "",
        "# Installer localement dans un projet test",
        "mkdir ../mon-projet-test && cd ../mon-projet-test",
        "npm init -y",
        "npm install ../getmipay-sdk-js/getmipay-sdk-1.0.0.tgz",
        "",
        "# Vérifier que l'import fonctionne",
        "node -e \"const { GetMiPay } = require('@getmipay/sdk'); console.log('Import OK:', typeof GetMiPay);\"",
        "# → Import OK: function",
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // CHAPITRE 4 — GUIDE DE RÉALISATION ÉTAPE PAR ÉTAPE
      // ══════════════════════════════════════════════════════════════
      h1("4. Guide de réalisation complet"),

      h2("4.1 Étape 1 — Préparation de l'environnement"),
      para("Durée estimée : 15 à 30 minutes."),
      spacer(120),
      h3("4.1.1 Installer Node.js LTS v22"),
      codeBlock([
        "# Option A : télécharger l'installeur sur nodejs.org (recommandé Windows/Mac)",
        "# https://nodejs.org/en/download/",
        "",
        "# Option B : via nvm (recommandé Linux/Mac)",
        "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
        "source ~/.bashrc",
        "nvm install 22",
        "nvm use 22",
        "nvm alias default 22",
        "",
        "# Vérification",
        "node --version    # v22.x.x",
        "npm --version     # 10.x.x",
      ]),
      spacer(120),
      h3("4.1.2 Créer le dépôt GitHub"),
      numbered("Se connecter sur github.com"),
      numbered("Cliquer 'New repository'"),
      numbered("Nommer le dépôt : getmipay-sdk-js"),
      numbered("Cocher 'Public' et 'Add a README file'"),
      numbered("Cliquer 'Create repository'"),
      spacer(120),
      h3("4.1.3 Cloner et initialiser"),
      codeBlock([
        "git clone https://github.com/VOTRE-COMPTE/getmipay-sdk-js.git",
        "cd getmipay-sdk-js",
      ]),

      spacer(200),
      h2("4.2 Étape 2 — Création de la structure de fichiers"),
      para("Durée estimée : 5 minutes."),
      spacer(80),
      codeBlock([
        "# Créer toute l'arborescence en une commande",
        "mkdir -p src/auth src/http src/models src/services src/utils types tests examples",
        "",
        "# Vérifier la structure",
        "find . -type d | grep -v node_modules | grep -v .git",
        "",
        "# Résultat attendu :",
        "# ./src",
        "# ./src/auth",
        "# ./src/http",
        "# ./src/models",
        "# ./src/services",
        "# ./src/utils",
        "# ./types",
        "# ./tests",
        "# ./examples",
      ]),

      spacer(200),
      h2("4.3 Étape 3 — Création des fichiers sources"),
      para("Créer chaque fichier dans l'ordre suivant. L'ordre est important car chaque fichier dépend des précédents."),
      spacer(120),
      threeColTable(
        ["Ordre", "Fichier à créer", "Dépendances"],
        [
          ["1", "package.json", "Aucune — configuration du projet"],
          ["2", "src/utils/errors.js", "Aucune — classes d'erreurs de base"],
          ["3", "src/utils/validators.js", "errors.js"],
          ["4", "src/models/Payment.js", "Aucune — modèle de données"],
          ["5", "src/models/Response.js", "Aucune — modèle de réponse"],
          ["6", "src/config.js", "Aucune — configuration SDK"],
          ["7", "src/auth/signature.js", "Module natif Node.js 'crypto'"],
          ["8", "src/http/client.js", "axios, errors.js"],
          ["9", "src/services/Payments.js", "Tous les fichiers précédents"],
          ["10", "src/index.js", "config.js, Payments.js"],
          ["11", "types/index.d.ts", "Aucune — fichier TypeScript statique"],
          ["12", "tests/auth.test.js", "src/auth/signature.js"],
          ["13", "tests/payments.test.js", "src/index.js"],
          ["14", "examples/basic-payin.js", "src/index.js"],
          ["15", "examples/webhook-handler.js", "Module natif Node.js 'http'"],
          ["16", "tsconfig.json", "Aucune"],
          ["17", "README.md", "Aucune"],
          ["18", "CHANGELOG.md", "Aucune"],
        ],
        [1200, 3000, 5160]
      ),

      spacer(200),
      h2("4.4 Étape 4 — Installation des dépendances"),
      codeBlock([
        "# Installer toutes les dépendances déclarées dans package.json",
        "npm install",
        "",
        "# Vérifier l'installation",
        "ls node_modules | grep -E '^(axios|jest|typescript)$'",
        "# Doit afficher :",
        "# axios",
        "# jest",
        "# typescript",
        "",
        "# Vérifier qu'axios est bien utilisable",
        "node -e \"const axios = require('axios'); console.log('axios version:', axios.VERSION);\"",
      ]),

      spacer(200),
      h2("4.5 Étape 5 — Lancer et valider les tests"),
      codeBlock([
        "# Lancer la suite de tests complète",
        "npm test",
        "",
        "# Si tous les tests passent :",
        "# Test Suites: 2 passed, 2 total",
        "# Tests:       26 passed, 26 total",
        "",
        "# Générer le rapport de couverture",
        "npx jest --coverage",
        "",
        "# Couverture cible recommandée :",
        "# Statements : > 85%",
        "# Branches   : > 80%",
        "# Functions  : > 90%",
        "# Lines      : > 85%",
      ]),

      spacer(200),
      h2("4.6 Étape 6 — Test de l'exemple sandbox"),
      codeBlock([
        "# Définir la clé API sandbox",
        "# Windows :",
        "set GMP_API_KEY=gmp_sk_test_xxxxxxxxxxxx",
        "",
        "# Linux/Mac :",
        "export GMP_API_KEY=gmp_sk_test_xxxxxxxxxxxx",
        "",
        "# Lancer l'exemple",
        "node examples/basic-payin.js",
        "",
        "# Si une erreur 401 apparaît : la clé API est invalide",
        "# Si une erreur réseau apparaît : vérifier la connexion internet",
      ]),

      spacer(200),
      h2("4.7 Étape 7 — Création du package npm"),
      codeBlock([
        "# Créer l'archive .tgz sans publier",
        "npm pack",
        "# → getmipay-sdk-1.0.0.tgz",
        "",
        "# Lister le contenu du package (vérifier que rien de sensible n'est inclus)",
        "tar -tzf getmipay-sdk-1.0.0.tgz",
        "",
        "# Contenu attendu :",
        "# package/package.json",
        "# package/src/index.js",
        "# package/src/config.js",
        "# package/src/auth/signature.js",
        "# package/src/http/client.js",
        "# package/src/models/Payment.js",
        "# package/src/models/Response.js",
        "# package/src/services/Payments.js",
        "# package/src/utils/errors.js",
        "# package/src/utils/validators.js",
        "# package/types/index.d.ts",
        "# package/README.md",
        "# package/CHANGELOG.md",
      ]),

      spacer(200),
      h2("4.8 Étape 8 — Publication sur npmjs.com"),
      codeBlock([
        "# 1. Créer un compte sur npmjs.com si pas déjà fait",
        "",
        "# 2. Se connecter en ligne de commande",
        "npm login",
        "# → Saisir : username, password, email, OTP (code 2FA)",
        "",
        "# 3. Vérifier la connexion",
        "npm whoami",
        "# → Doit afficher votre nom d'utilisateur npm",
        "",
        "# 4. Incrémenter la version (choisir selon le type de changement)",
        "npm version patch   # 1.0.0 → 1.0.1 (correction de bug)",
        "npm version minor   # 1.0.0 → 1.1.0 (nouvelle fonctionnalité)",
        "npm version major   # 1.0.0 → 2.0.0 (changement cassant)",
        "",
        "# 5. Publier (prepublishOnly lance npm test automatiquement)",
        "npm publish --access public",
        "",
        "# 6. Vérifier la publication",
        "npm view @getmipay/sdk",
        "npm view @getmipay/sdk version",
      ]),

      spacer(200),
      h2("4.9 Étape 9 — Vérification post-publication"),
      codeBlock([
        "# Tester l'installation depuis le registre npm",
        "cd /tmp",
        "mkdir test-sdk && cd test-sdk",
        "npm init -y",
        "npm install @getmipay/sdk",
        "",
        "# Créer un fichier test rapide",
        "cat > test.js << 'EOF'",
        "const { GetMiPay } = require('@getmipay/sdk');",
        "const sdk = new GetMiPay({ apiKey: 'test_key', environment: 'sandbox' });",
        "console.log('SDK importé avec succès');",
        "console.log('Services disponibles:', Object.keys(sdk));",
        "EOF",
        "",
        "node test.js",
        "# → SDK importé avec succès",
        "# → Services disponibles: [ 'config', 'payments' ]",
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // CHAPITRE 5 — RÉFÉRENCE API
      // ══════════════════════════════════════════════════════════════
      h1("5. Référence API complète"),

      h2("5.1 Constructeur GetMiPay"),
      codeBlock([
        "const { GetMiPay } = require('@getmipay/sdk');",
        "",
        "const mipay = new GetMiPay({",
        "  apiKey     : 'gmp_sk_test_xxxxxxxxxxxx',  // obligatoire",
        "  environment: 'sandbox',                   // 'sandbox' | 'production'",
        "  timeout    : 30000,                       // optionnel, en millisecondes",
        "});",
      ]),
      spacer(120),
      threeColTable(
        ["Paramètre", "Type", "Description"],
        [
          ["apiKey", "string (requis)", "Clé secrète API GetMiPay. Format : gmp_sk_test_... ou gmp_sk_live_..."],
          ["environment", "string (optionnel)", "'sandbox' (défaut) pour les tests, 'production' pour le déploiement."],
          ["timeout", "number (optionnel)", "Timeout HTTP en millisecondes. Défaut : 30000 (30 secondes)."],
        ]
      ),

      spacer(200),
      h2("5.2 payments.payin(params)"),
      codeBlock([
        "const response = await mipay.payments.payin({",
        "  amount        : 5000,                          // obligatoire",
        "  currency      : 'XOF',                         // obligatoire",
        "  wallet        : '+2250700000000',              // obligatoire",
        "  callback_url  : 'https://yourapp.com/webhook', // obligatoire",
        "  customer_name : 'Jean Dupont',                 // optionnel",
        "  customer_email: 'jean@example.com',            // optionnel",
        "  description   : 'Abonnement mensuel',          // optionnel",
        "});",
      ]),
      spacer(120),
      threeColTable(
        ["Paramètre", "Requis", "Validation appliquée"],
        [
          ["amount", "Oui", "Doit être un nombre positif (> 0). Erreur si string, négatif, ou zéro."],
          ["currency", "Oui", "Code ISO 4217 en 3 lettres majuscules. Regex : /^[A-Z]{3}$/. Ex: XOF, EUR, USD."],
          ["wallet", "Oui", "Numéro de portefeuille mobile money. Pas de validation de format côté SDK."],
          ["callback_url", "Oui", "URL valide. Validée via new URL(). Erreur si mal formée."],
          ["customer_name", "Non", "Aucune validation. Défaut : chaîne vide."],
          ["customer_email", "Non", "Aucune validation de format email côté SDK. Défaut : chaîne vide."],
          ["description", "Non", "Aucune validation. Défaut : chaîne vide."],
        ]
      ),
      spacer(160),
      para("La méthode retourne une instance de Response avec les propriétés suivantes :"),
      spacer(80),
      twoColTable(
        ["Propriété / Méthode", "Description"],
        [
          ["response.reference", "Référence unique du paiement (ex: 'GMP-123456')."],
          ["response.status", "Statut : 'pending', 'success' ou 'failed'."],
          ["response.amount", "Montant confirmé par l'API."],
          ["response.currency", "Code devise confirmé par l'API."],
          ["response.created_at", "Date/heure ISO 8601 de création."],
          ["response.isSuccess()", "Retourne true si status === 'success'."],
          ["response.isPending()", "Retourne true si status === 'pending'."],
          ["response.isFailed()", "Retourne true si status === 'failed'."],
          ["response.raw", "Objet JSON brut complet retourné par l'API."],
        ]
      ),

      spacer(200),
      h2("5.3 payments.getStatus(reference)"),
      codeBlock([
        "const status = await mipay.payments.getStatus('GMP-123456');",
        "",
        "console.log(status.status);       // 'success'",
        "console.log(status.isSuccess());  // true",
      ]),

      spacer(200),
      h2("5.4 Codes d'erreur HTTP"),
      threeColTable(
        ["Code HTTP", "Classe levée", "Signification"],
        [
          ["0", "ApiError", "Timeout (30s dépassés) ou connexion réseau impossible."],
          ["400", "ApiError", "Requête mal formée. Vérifier le format du payload."],
          ["401", "ApiError", "Clé API invalide ou signature HMAC incorrecte."],
          ["422", "ApiError", "Données métier invalides (ex: devise non supportée, numéro inexistant)."],
          ["429", "ApiError", "Trop de requêtes. Implémenter un mécanisme de retry avec backoff."],
          ["500", "ApiError", "Erreur interne du serveur GetMiPay. Réessayer après un délai."],
          ["-", "ValidationError", "Paramètre manquant ou invalide. Levée avant tout appel réseau."],
        ]
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // CHAPITRE 6 — BONNES PRATIQUES ET SÉCURITÉ
      // ══════════════════════════════════════════════════════════════
      h1("6. Bonnes pratiques et sécurité"),

      h2("6.1 Gestion de la clé API"),
      infoBox("Règle absolue", "Ne jamais inclure la clé API dans le code source. Ne jamais la committer sur GitHub. Utiliser uniquement des variables d'environnement.", RED_BG, RED_DARK, RED_DARK),
      spacer(160),
      codeBlock([
        "# .env (ne jamais committer ce fichier)",
        "GMP_API_KEY=gmp_sk_live_xxxxxxxxxxxx",
        "",
        "# .gitignore (toujours inclure)",
        ".env",
        "node_modules/",
        "",
        "# Dans le code : laisser le SDK lire la variable automatiquement",
        "const mipay = new GetMiPay({",
        "  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'",
        "  // apiKey est lu automatiquement depuis GMP_API_KEY",
        "});",
      ]),

      spacer(200),
      h2("6.2 Gestion des erreurs en production"),
      codeBlock([
        "async function traiterPaiement(params) {",
        "  try {",
        "    const response = await mipay.payments.payin(params);",
        "",
        "    if (response.isPending()) {",
        "      // Stocker la référence et attendre le webhook",
        "      await db.savePendingPayment(response.reference);",
        "      return { success: true, reference: response.reference };",
        "    }",
        "",
        "  } catch (error) {",
        "    if (error.name === 'ValidationError') {",
        "      // Bug code → logger et retourner une erreur 400",
        "      logger.error('SDK validation error:', error.message);",
        "      return { success: false, error: 'invalid_params', detail: error.message };",
        "",
        "    } else if (error.name === 'ApiError') {",
        "      if (error.statusCode === 429) {",
        "        // Rate limit → retry après délai",
        "        await sleep(2000);",
        "        return traiterPaiement(params); // retry",
        "      }",
        "      // Autres erreurs API → logger et retourner 500",
        "      logger.error('GetMiPay API error:', error.statusCode, error.message);",
        "      return { success: false, error: 'payment_failed' };",
        "    }",
        "  }",
        "}",
      ]),

      spacer(200),
      h2("6.3 Environnements et déploiement"),
      twoColTable(
        ["Environnement", "Configuration recommandée"],
        [
          ["Développement local", "environment: 'sandbox', GMP_API_KEY=gmp_sk_test_xxx dans .env"],
          ["CI/CD (GitHub Actions)", "GMP_API_KEY injectée en secret GitHub, environment: 'sandbox' pour les tests"],
          ["Staging", "environment: 'sandbox', clé sandbox dans les secrets du serveur de staging"],
          ["Production", "environment: 'production', clé live dans les secrets Vault ou AWS Secrets Manager"],
        ]
      ),

      spacer(300),

      // ── Pied de page du document ─────────────────────────────────
      new Table({
        width: { size: 9720, type: WidthType.DXA },
        columnWidths: [9720],
        borders: { top: border(BLUE_MED, 8), bottom: noBorder(), left: noBorder(), right: noBorder(), insideH: noBorder(), insideV: noBorder() },
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: BLUE_PALE, type: ShadingType.CLEAR },
          borders: noBorders(),
          margins: { top: 200, bottom: 200, left: 300, right: 300 },
          width: { size: 9720, type: WidthType.DXA },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Documentation rédigée pour le SDK @getmipay/sdk v1.0.0", font: "Arial", size: 20, color: BLUE_DARK, bold: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "github.com/getmipay/getmipay-sdk-js  ·  npmjs.com/package/@getmipay/sdk", font: "Arial", size: 18, color: GRAY_MED })] }),
          ]
        })]})],
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/mnt/user-data/outputs/Documentation_SDK_GetMiPay.docx', buffer);
  console.log('Document généré avec succès.');
});