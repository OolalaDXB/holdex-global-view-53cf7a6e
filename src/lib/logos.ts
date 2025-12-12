// Institution logo utilities using logo.dev API (free, no CORS issues)

// Map of known institutions to their domains for logo.dev
const institutionDomains: Record<string, string> = {
  // Banks - UAE
  'Emirates NBD': 'emiratesnbd.com',
  'ADCB': 'adcb.com',
  'FAB': 'bankfab.com',
  'Mashreq': 'mashreqbank.com',
  'RAK Bank': 'rakbank.ae',
  'DIB': 'dib.ae',
  
  // Banks - Europe
  'BNP Paribas': 'bnpparibas.com',
  'HSBC': 'hsbc.com',
  'UBS': 'ubs.com',
  'Credit Suisse': 'credit-suisse.com',
  'Deutsche Bank': 'db.com',
  'Barclays': 'barclays.co.uk',
  'Santander': 'santander.com',
  'ING': 'ing.com',
  'Millennium BCP': 'millenniumbcp.pt',
  'Société Générale': 'societegenerale.com',
  'Credit Agricole': 'credit-agricole.com',
  
  // Banks - US
  'Chase': 'chase.com',
  'Bank of America': 'bankofamerica.com',
  'Wells Fargo': 'wellsfargo.com',
  'Citi': 'citi.com',
  'Goldman Sachs': 'goldmansachs.com',
  'Morgan Stanley': 'morganstanley.com',
  'JP Morgan': 'jpmorgan.com',
  
  // Banks - Other
  'Bank of Georgia': 'bankofgeorgia.ge',
  'TBC Bank': 'tbcbank.ge',
  'Sberbank': 'sberbank.ru',
  'Tinkoff': 'tinkoff.ru',
  'Alfa Bank': 'alfabank.ru',
  
  // Brokers & Investment
  'Interactive Brokers': 'interactivebrokers.com',
  'Swissquote': 'swissquote.com',
  'Degiro': 'degiro.com',
  'eToro': 'etoro.com',
  'Saxo Bank': 'home.saxo',
  'Charles Schwab': 'schwab.com',
  'Fidelity': 'fidelity.com',
  'Vanguard': 'vanguard.com',
  'Robinhood': 'robinhood.com',
  
  // Fintech
  'Wise': 'wise.com',
  'Revolut': 'revolut.com',
  'N26': 'n26.com',
  'Monzo': 'monzo.com',
  'Chime': 'chime.com',
  
  // Crypto
  'Coinbase': 'coinbase.com',
  'Binance': 'binance.com',
  'Kraken': 'kraken.com',
  'Ledger': 'ledger.com',
  'Trezor': 'trezor.io',
  'Phantom': 'phantom.app',
  
  // Insurance
  'AXA': 'axa.com',
  'Allianz': 'allianz.com',
  'Zurich': 'zurich.com',
  
  // Asset Managers
  'BlackRock': 'blackrock.com',
  'PIMCO': 'pimco.com',
  'Sequoia': 'sequoiacap.com',
  'Seedcamp': 'seedcamp.com',
  'Andreessen Horowitz': 'a16z.com',
  
  // Auto Finance
  'Porsche Financial Services': 'porsche.com',
};

export const getInstitutionLogo = (institution: string): string | null => {
  if (!institution) return null;
  
  // Check for exact match
  let domain = institutionDomains[institution];
  
  // Check for partial match (case insensitive)
  if (!domain) {
    const lowerInstitution = institution.toLowerCase();
    for (const [key, value] of Object.entries(institutionDomains)) {
      if (key.toLowerCase().includes(lowerInstitution) || lowerInstitution.includes(key.toLowerCase())) {
        domain = value;
        break;
      }
    }
  }
  
  // Guess domain from name if no match
  if (!domain) {
    domain = institution
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '') + '.com';
  }
  
  // Use Google's favicon service which works reliably with CORS
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

// Fallback if logo fails to load - returns initials
export const getLogoFallback = (institution: string): string => {
  if (!institution) return '?';
  
  return institution
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
