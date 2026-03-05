export interface KpiThreshold {
  good: number
  medium: number
  direction: 'higher-better' | 'lower-better'
  min: number
  max: number
}

export const KPI_THRESHOLDS: Record<string, KpiThreshold> = {
  bruttomietrendite: { good: 5, medium: 3, direction: 'higher-better', min: 0, max: 10 },
  eigenkapitalrendite: { good: 8, medium: 3, direction: 'higher-better', min: -5, max: 20 },
  kaufpreisfaktor: { good: 20, medium: 25, direction: 'lower-better', min: 10, max: 40 },
  dscr: { good: 1.25, medium: 1.0, direction: 'higher-better', min: 0, max: 3 },
  nettomietrendite: { good: 4, medium: 2.5, direction: 'higher-better', min: 0, max: 8 },
  cashOnCash: { good: 3, medium: 0, direction: 'higher-better', min: -10, max: 15 },
  eigennutzungRendite: { good: 4, medium: 1, direction: 'higher-better', min: -5, max: 10 },
  leistbarkeit: { good: 30, medium: 40, direction: 'lower-better', min: 0, max: 80 },
}

export interface KpiInfoData {
  label: string
  description: string
  formula: string
  interpretation: {
    gut: string
    mittel: string
    schlecht: string
  }
  metaphor: {
    title: string
    text: string
  }
}

export const KPI_INFO: Record<string, KpiInfoData> = {
  cashflow: {
    label: 'Monatlicher Cashflow',
    description:
      'Der monatliche Cashflow zeigt, wie viel Geld nach Abzug aller Kosten '
      + '(Kreditrate, Bewirtschaftungskosten, Steuern) von den Mieteinnahmen '
      + 'jeden Monat übrig bleibt. Er ist die wichtigste Kennzahl für die laufende '
      + 'Liquidität eines Immobilieninvestments.',
    formula: 'Nettomiete − Betriebskosten − Kreditrate (Zins + Tilgung) − Steuerlast',
    interpretation: {
      gut: 'Positiv (> 100 €/Mon): Die Immobilie trägt sich selbst und wirft Überschuss ab.',
      mittel: 'Um 0 €: Die Immobilie trägt sich gerade so. Tilgung baut dennoch Vermögen auf.',
      schlecht: 'Negativ (< −200 €/Mon): Sie müssen monatlich zuschießen.',
    },
    metaphor: {
      title: 'Wie ein Bankkonto',
      text: 'Stellen Sie sich Ihre Immobilie wie ein Bankkonto vor: Jeden Monat '
        + 'fließen Mieteinnahmen hinein (Einzahlung) und Kosten heraus (Abbuchungen für '
        + 'Kredit, Hausverwaltung, Reparaturen, Steuern). '
        + 'Der Cashflow ist der Kontostand am Monatsende. '
        + 'Ist er positiv, bleibt Geld übrig — wie ein Gehalt, das nach allen Fixkosten noch reicht. '
        + 'Ist er negativ, müssen Sie aus eigener Tasche nachfüllen — wie wenn die Fixkosten das Gehalt übersteigen.',
    },
  },
  bruttomietrendite: {
    label: 'Bruttomietrendite',
    description:
      'Die Bruttomietrendite setzt die jährliche Kaltmiete ins Verhältnis zum Kaufpreis. '
      + 'Sie ist der einfachste Rendite-Indikator und eignet sich gut für einen schnellen '
      + 'Vergleich verschiedener Objekte. Sie berücksichtigt jedoch keine Kaufnebenkosten '
      + 'oder laufende Bewirtschaftungskosten.',
    formula: '(Jahreskaltmiete ÷ Kaufpreis) × 100',
    interpretation: {
      gut: 'Ab 5 %: Sehr attraktiv, vor allem in B/C-Lagen.',
      mittel: '3–5 %: Durchschnittlich, typisch für gute Lagen in Großstädten.',
      schlecht: 'Unter 3 %: Teuer, typisch für Top-Lagen in München, Hamburg, Frankfurt.',
    },
    metaphor: {
      title: 'Wie Zinsen auf einem Sparkonto',
      text: 'Stellen Sie sich vor, Sie legen den Kaufpreis auf ein Sparkonto. '
        + 'Die Bruttomietrendite entspricht dem Zinssatz, den dieses Sparkonto Ihnen zahlen würde. '
        + 'Bei 4 % Bruttomietrendite ist es so, als würde Ihr „Immobilien-Sparkonto" '
        + 'Ihnen 4 % Zinsen zahlen — allerdings vor Abzug aller Kosten. '
        + 'Je höher die Rendite, desto mehr „Zinsen" bekommen Sie für Ihr eingesetztes Geld.',
    },
  },
  kaufpreisfaktor: {
    label: 'Kaufpreisfaktor',
    description:
      'Der Kaufpreisfaktor (auch Vervielfältiger genannt) zeigt, wie viele '
      + 'Jahresnettomieten nötig wären, um den Kaufpreis vollständig zu bezahlen. '
      + 'Er ist der Kehrwert der Bruttomietrendite und ein Maß dafür, ob der Preis '
      + 'im Verhältnis zur Miete angemessen ist.',
    formula: 'Kaufpreis ÷ Jahresnettomiete',
    interpretation: {
      gut: 'Unter 20: Sehr günstiger Preis im Verhältnis zur Miete.',
      mittel: '20–25: Fairer Preis, marktüblich in vielen Regionen.',
      schlecht: 'Über 25: Eher teuer, typisch für Top-Lagen mit hohem Wertsteigerungspotenzial.',
    },
    metaphor: {
      title: 'Wie viele Jahre Miete',
      text: 'Stellen Sie sich vor, ein Mieter zahlt Ihnen jeden Monat Miete in einen Topf. '
        + 'Der Kaufpreisfaktor sagt Ihnen, wie viele Jahre es dauert, bis der Topf so voll ist '
        + 'wie der Kaufpreis. Bei Faktor 20 dauert es 20 Jahre reiner Mieteinnahmen. '
        + 'Je weniger Jahre, desto günstiger haben Sie gekauft — wie ein Schnäppchen beim Einkaufen.',
    },
  },
  eigenkapitalrendite: {
    label: 'Eigenkapitalrendite',
    description:
      'Die Eigenkapitalrendite zeigt die jährliche Verzinsung Ihres eingesetzten '
      + 'Eigenkapitals. Sie berücksichtigt den Leverage-Effekt: durch Fremdfinanzierung '
      + 'kann die Rendite auf Ihr eigenes Geld deutlich höher sein als die Gesamtrendite '
      + 'der Immobilie. Die Tilgung wird als Vermögensaufbau eingerechnet.',
    formula: '(Cashflow nach Steuer + jährliche Tilgung) ÷ Eigenkapital × 100',
    interpretation: {
      gut: 'Ab 8 %: Ausgezeichnete Eigenkapitalverzinsung, besser als die meisten Alternativen.',
      mittel: '3–8 %: Solide Rendite, vergleichbar mit Aktienmarkt-Durchschnitt.',
      schlecht: 'Unter 3 %: Schwache Verzinsung, Alternativen wie ETFs könnten attraktiver sein.',
    },
    metaphor: {
      title: 'Wie gut arbeitet Ihr Geld',
      text: 'Stellen Sie sich vor, Sie schicken Ihr Eigenkapital als Angestellten in ein Büro. '
        + 'Die Eigenkapitalrendite ist das Gehalt, das Ihr Geld jeden Monat nach Hause bringt. '
        + 'Der Clou: Durch den Bankkredit (Fremdkapital) hebelt Ihr kleines Eigenkapital-Team '
        + 'die Arbeit einer viel größeren Mannschaft — das ist der berühmte Hebeleffekt. '
        + 'Wenig eigenes Geld kann viel bewirken, aber auch das Risiko steigt.',
    },
  },
  dscr: {
    label: 'DSCR (Schuldendienstdeckungsgrad)',
    description:
      'Der Debt Service Coverage Ratio (DSCR) zeigt, wie gut die Nettomieteinnahmen '
      + '(nach Betriebskosten, vor Steuern) ausreichen, um die jährliche Kreditrate '
      + 'zu bedienen. Er ist die wichtigste Kennzahl für Banken bei der Kreditvergabe.',
    formula: '(Nettomiete − Betriebskosten) ÷ jährliche Kreditrate',
    interpretation: {
      gut: 'Ab 1,25: Komfortable Deckung mit 25 % Sicherheitspuffer. Banken sind zufrieden.',
      mittel: '1,0–1,25: Miete deckt die Rate, aber wenig Spielraum für Unvorhergesehenes.',
      schlecht: 'Unter 1,0: Mieteinnahmen reichen nicht für die Kreditrate — Sie müssen zuschießen.',
    },
    metaphor: {
      title: 'Wie ein Sicherheitsnetz',
      text: 'Denken Sie an einen Seiltänzer: Die Mieteinnahmen sind das Seil, die Kreditrate '
        + 'ist der Weg, den er gehen muss. Der DSCR beschreibt die Breite des Sicherheitsnetzes darunter. '
        + 'Bei 1,0 gibt es kein Netz — ein Fehltritt (Mietausfall) und Sie fallen. '
        + 'Bei 1,25 haben Sie 25 % Polster, falls mal ein Mieter ausfällt oder eine Reparatur ansteht. '
        + 'Banken wollen mindestens 1,25 sehen, bevor sie Ihnen den Kredit geben.',
    },
  },
  nettomietrendite: {
    label: 'Nettomietrendite',
    description:
      'Die Nettomietrendite berücksichtigt im Gegensatz zur Bruttomietrendite '
      + 'sowohl die Kaufnebenkosten als auch die laufenden Betriebskosten. '
      + 'Sie ist damit deutlich aussagekräftiger und näher an der tatsächlichen Rendite.',
    formula: '(Nettomiete − Betriebskosten) ÷ Gesamtkosten inkl. Nebenkosten × 100',
    interpretation: {
      gut: 'Ab 4 %: Starke Rendite nach Abzug aller Kosten.',
      mittel: '2,5–4 %: Durchschnittlich, aber solide.',
      schlecht: 'Unter 2,5 %: Geringe Nettorendite, genau hinschauen.',
    },
    metaphor: {
      title: 'Wie Bruttomietrendite, aber ehrlicher',
      text: 'Wenn die Bruttomietrendite Ihr Bruttogehalt ist, dann ist die Nettomietrendite '
        + 'Ihr Nettogehalt — was nach Abzug aller „Steuern und Sozialabgaben" '
        + '(Kaufnebenkosten, Verwaltung, Instandhaltung, Leerstand) tatsächlich übrig bleibt. '
        + 'So wie beim Gehalt zählt am Ende nur das Netto, nicht das Brutto.',
    },
  },
  cashOnCash: {
    label: 'Cash-on-Cash Return',
    description:
      'Der Cash-on-Cash Return zeigt den reinen Cashflow-Ertrag bezogen auf Ihr '
      + 'eingesetztes Eigenkapital, ohne die Tilgung als Vermögensaufbau einzurechnen. '
      + 'Er beantwortet die Frage: Wie viel bares Geld fließt tatsächlich zurück?',
    formula: 'Jährlicher Cashflow nach Steuer ÷ Eigenkapital × 100',
    interpretation: {
      gut: 'Positiv: Die Immobilie erwirtschaftet bares Geld für Sie.',
      mittel: 'Um 0 %: Kein Cash-Rückfluss, aber Tilgung baut Vermögen auf.',
      schlecht: 'Negativ: Sie legen monatlich Geld drauf — die Immobilie kostet Sie Liquidität.',
    },
    metaphor: {
      title: 'Wie viel Bargeld fließt zurück',
      text: 'Stellen Sie sich vor, Sie werfen Geld in einen Automaten (Ihr Eigenkapital). '
        + 'Cash-on-Cash sagt Ihnen, wie viel Bargeld der Automat jeden Monat ausspuckt. '
        + 'Anders als die Eigenkapitalrendite zählt hier nur bares Geld, '
        + 'das auf Ihrem Konto landet — nicht der „unsichtbare" Vermögensaufbau durch Tilgung. '
        + 'Viele Immobilien haben negative Cash-on-Cash-Werte, bauen aber trotzdem langfristig Vermögen auf.',
    },
  },
  jaehrlichCashflowNachSteuer: {
    label: 'Cashflow nach Steuer (jährlich)',
    description:
      'Der jährliche Cashflow nach Steuer fasst den monatlichen Cashflow auf Jahresbasis '
      + 'zusammen. Er zeigt den tatsächlichen jährlichen Geldfluss nach allen Abzügen '
      + 'und ist die Grundlage für den langfristigen Investmentvergleich.',
    formula: '(Nettomiete − Betriebskosten − Kreditrate − Steuerlast) × 12 Monate',
    interpretation: {
      gut: 'Über 1.200 €/Jahr: Solider positiver Cashflow, die Immobilie trägt sich.',
      mittel: 'Um 0 €/Jahr: Break-even — kein Zuschuss nötig, aber auch kein Überschuss.',
      schlecht: 'Unter −2.400 €/Jahr: Hoher jährlicher Zuschuss von über 200 €/Monat nötig.',
    },
    metaphor: {
      title: 'Ihr jährliches Immobilien-Gehalt',
      text: 'Stellen Sie sich die Immobilie als Nebenjob vor. Der jährliche Cashflow '
        + 'nach Steuer ist Ihr Jahresgehalt aus diesem Job. Ist es positiv, verdienen Sie dazu — '
        + 'wie ein bezahlter Nebenjob. Ist es negativ, zahlen Sie drauf — '
        + 'wie ein teures Hobby, das Sie sich leisten. Allerdings: Auch bei negativem „Gehalt" '
        + 'baut die Tilgung Vermögen auf, wie eine erzwungene Sparrate.',
    },
  },
  monatlicheKosten: {
    label: 'Monatliche Kosten',
    description:
      'Die monatlichen Kosten bei Eigennutzung zeigen Ihre gesamte monatliche Belastung '
      + 'durch die Immobilie. Sie umfassen die Kreditrate (Zins + Tilgung) sowie alle '
      + 'Betriebskosten (Instandhaltung, Verwaltung, Nebenkosten). Da Sie selbst wohnen, '
      + 'gibt es keine Mieteinnahmen — dafür sparen Sie sich die Miete an anderer Stelle.',
    formula: 'Kreditrate + (Betriebskosten ÷ 12)',
    interpretation: {
      gut: 'Unter vergleichbarer Miete: Eigennutzung lohnt sich finanziell.',
      mittel: 'Etwa gleich wie Miete: Langfristig profitieren Sie durch Tilgung und Wertsteigerung.',
      schlecht: 'Deutlich über Miete: Hohe laufende Belastung, prüfen Sie die Gesamtrendite.',
    },
    metaphor: {
      title: 'Wie Ihre neue Wohnkostenrechnung',
      text: 'Stellen Sie sich vor, Sie tauschen Ihre Mietrechnung gegen eine neue Kostenaufstellung. '
        + 'Statt Miete zahlen Sie jetzt Kreditrate und Hausgeld. Der Unterschied: '
        + 'Ein Teil der Kreditrate (die Tilgung) fließt in Ihr eigenes Vermögen, '
        + 'während Miete komplett weg ist. Die monatlichen Kosten zeigen die neue Rechnung.',
    },
  },
  ersparteMiete: {
    label: 'Ersparte Miete',
    description:
      'Die ersparte Miete ist eine kalkulatorische Größe: Sie entspricht der Miete, '
      + 'die Sie zahlen müssten, wenn Sie die Immobilie nicht selbst nutzen würden, '
      + 'sondern vergleichbaren Wohnraum anmieten. Diese „eingesparte" Miete ist der '
      + 'Gegenwert Ihrer Eigennutzung und fließt in die Renditeberechnung ein.',
    formula: 'Kalkulatorische Monatsmiete × 12',
    interpretation: {
      gut: 'Über monatliche Kosten: Eigennutzung spart effektiv Geld.',
      mittel: 'Etwa gleich: Weder Vorteil noch Nachteil gegenüber Mieten.',
      schlecht: 'Unter monatliche Kosten: Mieten wäre günstiger — aber Vermögensaufbau beachten.',
    },
    metaphor: {
      title: 'Wie ein unsichtbares Gehalt',
      text: 'Stellen Sie sich vor, Sie bekommen jeden Monat ein Gehalt dafür, '
        + 'dass Sie in Ihrer eigenen Wohnung leben — nämlich die Miete, die Sie nicht mehr '
        + 'an einen Vermieter überweisen müssen. Dieses „unsichtbare Gehalt" ist die ersparte Miete. '
        + 'Es landet nicht auf Ihrem Konto, aber es verlässt es auch nicht mehr.',
    },
  },
  eigennutzungRendite: {
    label: 'Eigennutzung-Rendite',
    description:
      'Die Eigennutzung-Rendite zeigt, wie sich Ihr eingesetztes Eigenkapital bei '
      + 'Selbstnutzung verzinst. Sie berücksichtigt die ersparte Miete als „Ertrag", '
      + 'zieht alle laufenden Kosten ab und rechnet Tilgung sowie Wertsteigerung '
      + 'als Vermögensaufbau ein. So lässt sich Eigennutzung mit Vermietung oder '
      + 'anderen Anlageformen vergleichen.',
    formula: '(Ersparte Miete − Betriebskosten − Kreditrate + Tilgung + Wertsteigerung) ÷ Eigenkapital × 100',
    interpretation: {
      gut: 'Ab 4 %: Sehr gute Rendite, Eigennutzung rechnet sich auch finanziell.',
      mittel: '1–4 %: Solide Rendite, vergleichbar mit konservativen Anlagen.',
      schlecht: 'Unter 1 %: Geringe Rendite, Alternative Investments könnten lukrativer sein.',
    },
    metaphor: {
      title: 'Wie der Gesamtertrag Ihres Zuhauses',
      text: 'Stellen Sie sich vor, Ihr Eigenkapital ist ein Mitarbeiter, den Sie ins Eigenheim schicken. '
        + 'Sein „Gehalt" setzt sich aus drei Teilen zusammen: die ersparte Miete (was er verdient), '
        + 'die Tilgung (was er spart) und die Wertsteigerung (was er an Bonus bekommt). '
        + 'Davon gehen Kosten ab (Kredit, Instandhaltung). Die Rendite zeigt, '
        + 'wie produktiv Ihr Eigenkapital-Mitarbeiter insgesamt arbeitet.',
    },
  },
  leistbarkeit: {
    label: 'Leistbarkeit',
    description:
      'Die Leistbarkeit zeigt, welchen Anteil Ihres Nettoeinkommens die Immobilie '
      + 'monatlich beansprucht (Belastungsquote). Banken empfehlen maximal 30–35 % '
      + 'des Nettoeinkommens für Wohnkosten. Ab 40 % wird die Finanzierung riskant.',
    formula: '(Monatliche Immobilienkosten ÷ Nettoeinkommen) × 100',
    interpretation: {
      gut: 'Bis 30 %: Komfortable Belastung, genug Puffer für Unvorhergesehenes.',
      mittel: '30–40 %: Grenzwertig, wenig finanzieller Spielraum.',
      schlecht: 'Über 40 %: Überlastung — hohes Risiko bei Einkommensausfall oder Zinsänderung.',
    },
    metaphor: {
      title: 'Wie ein Budgetplan',
      text: 'Stellen Sie sich Ihr monatliches Nettoeinkommen als einen Kuchen vor. '
        + 'Die Belastungsquote zeigt, wie großes Stück die Immobilie davon abschneidet. '
        + 'Bis 30 % bleibt genug Kuchen für Lebensmittel, Versicherungen, Freizeit und Rücklagen. '
        + 'Ab 40 % wird es eng — wie wenn jemand fast die Hälfte Ihres Kuchens nimmt '
        + 'und Sie sich den Rest für alles andere teilen müssen.',
    },
  },
  marktvergleich: {
    label: 'Preis vs. Markt',
    description:
      'Der Marktvergleich zeigt, wie Ihr Kaufpreis pro Quadratmeter im Vergleich zum '
      + 'regionalen Durchschnitt liegt. Grundlage sind aktuelle Marktdaten für die '
      + 'Stadtteile in Herzogenaurach und Erlangen.',
    formula: '(Eigener Preis/m² − Ø Regionspreis/m²) ÷ Ø Regionspreis/m² × 100',
    interpretation: {
      gut: 'Unter −5 %: Günstiger als der Markt — potenzielles Schnäppchen.',
      mittel: '−5 % bis +10 %: Im Marktdurchschnitt — fairer Preis.',
      schlecht: 'Über +10 %: Teurer als der Markt — gute Gründe erforderlich.',
    },
    metaphor: {
      title: 'Wie ein Preisvergleich beim Einkaufen',
      text: 'Stellen Sie sich vor, Sie kaufen ein Produkt und vergleichen den Preis '
        + 'mit dem Durchschnittspreis in verschiedenen Geschäften der Umgebung. '
        + 'Liegt Ihr Preis deutlich darunter, haben Sie ein Schnäppchen gemacht. '
        + 'Liegt er deutlich darüber, sollten Sie prüfen, ob die Qualität den Aufpreis rechtfertigt.',
    },
  },
  vermoegenszuwachs: {
    label: 'Vermögenszuwachs',
    description:
      'Der Vermögenszuwachs zeigt den gesamten monatlichen Vermögensaufbau durch '
      + 'Ihre Immobilie. Er kombiniert drei Komponenten: den Cashflow (was tatsächlich '
      + 'auf Ihrem Konto landet), die Tilgung (Schuldenabbau = Eigenkapitalaufbau im Objekt) '
      + 'und die Wertsteigerung der Immobilie. Diese Kennzahl zeigt das Gesamtbild — '
      + 'auch bei negativem Cashflow kann der Vermögenszuwachs deutlich positiv sein.',
    formula: 'Cashflow nach Steuer + Tilgung + (Kaufpreis × Wertsteigerung %)',
    interpretation: {
      gut: 'Über 500 €/Mon: Starker Vermögensaufbau, die Immobilie arbeitet kräftig für Sie.',
      mittel: '100–500 €/Mon: Solider Vermögensaufbau, besser als viele Sparformen.',
      schlecht: 'Unter 0 €/Mon: Vermögensverlust — Cashflow-Verlust übersteigt Tilgung und Wertzuwachs.',
    },
    metaphor: {
      title: 'Wie ein Sparschwein mit drei Schlitzen',
      text: 'Stellen Sie sich Ihre Immobilie als Sparschwein mit drei Einwurfschlitzen vor. '
        + 'Durch den ersten Schlitz fällt der Cashflow — das Geld, das jeden Monat übrig bleibt (oder fehlt). '
        + 'Durch den zweiten Schlitz fällt die Tilgung — jeden Monat zahlen Sie ein Stück '
        + 'des Kredits ab und die Immobilie gehört Ihnen ein bisschen mehr. '
        + 'Durch den dritten Schlitz fällt die Wertsteigerung — die Immobilie wird von alleine wertvoller. '
        + 'Der Vermögenszuwachs ist alles zusammen: Was am Ende im Sparschwein landet.',
    },
  },
}
