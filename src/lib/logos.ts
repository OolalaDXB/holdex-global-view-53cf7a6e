// Institution logo utilities using Clearbit Logo API

export const getInstitutionLogo = (institution: string): string | null => {
  if (!institution) return null;
  
  // Map of known institutions to their domains
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
    'Barclays': 'barclays.com',
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
  };

  const domain = institutionDomains[institution];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  
  // Try to guess domain from institution name
  const guessedDomain = institution
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '') + '.com';
  
  return `https://logo.clearbit.com/${guessedDomain}`;
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
