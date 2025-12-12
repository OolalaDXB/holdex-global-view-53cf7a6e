// Institution logo utilities using logo.dev API (free, no CORS issues)

// Map of known institutions to their domains for logo.dev
const institutionDomains: Record<string, string> = {
  // Banks - UAE
  'WIO': 'wio.io',
  'Wio': 'wio.io',
  'Wio Bank': 'wio.io',
  'Emirates NBD': 'emiratesnbd.com',
  'ENBD': 'emiratesnbd.com',
  'ADCB': 'adcb.com',
  'Abu Dhabi Commercial Bank': 'adcb.com',
  'FAB': 'bankfab.com',
  'First Abu Dhabi Bank': 'bankfab.com',
  'Mashreq': 'mashreqbank.com',
  'Mashreq Bank': 'mashreqbank.com',
  'RAK Bank': 'rakbank.ae',
  'RAKBANK': 'rakbank.ae',
  'DIB': 'dib.ae',
  'Dubai Islamic Bank': 'dib.ae',
  'CBD': 'cbd.ae',
  'Commercial Bank of Dubai': 'cbd.ae',
  'NBF': 'nbf.ae',
  'National Bank of Fujairah': 'nbf.ae',
  'Ajman Bank': 'ajmanbank.ae',
  'Al Hilal Bank': 'alhilalbank.ae',
  'Noor Bank': 'emiratesnbd.com',
  'LIV': 'liv.me',
  'Liv': 'liv.me',
  // Islamic Banks - UAE
  'Abu Dhabi Islamic Bank': 'adib.ae',
  'ADIB': 'adib.ae',
  'Emirates Islamic': 'emiratesislamic.ae',
  'EI': 'emiratesislamic.ae',
  'Sharjah Islamic Bank': 'sib.ae',
  'SIB': 'sib.ae',
  // Islamic Banks - GCC
  'Al Rajhi Bank': 'alrajhibank.com.sa',
  'Al Rajhi': 'alrajhibank.com.sa',
  'Kuwait Finance House': 'kfh.com',
  'KFH': 'kfh.com',
  'Qatar Islamic Bank': 'qib.com.qa',
  'QIB': 'qib.com.qa',
  'Bahrain Islamic Bank': 'bisb.com',
  'BISB': 'bisb.com',
  // Islamic Windows
  'ENBD Islamic': 'emiratesnbd.com',
  'ADCB Islamic': 'adcb.com',
  'FAB Islamic': 'bankfab.com',
  'HSBC Amanah': 'hsbc.com',
  'Standard Chartered Saadiq': 'sc.com',
  
  // Banks - France
  'BNP': 'bnpparibas.com',
  'BNP Paribas': 'bnpparibas.com',
  'BNP PARIBAS': 'bnpparibas.com',
  'Société Générale': 'societegenerale.com',
  'Societe Generale': 'societegenerale.com',
  'SG': 'societegenerale.com',
  'Credit Agricole': 'credit-agricole.fr',
  'Crédit Agricole': 'credit-agricole.fr',
  'LCL': 'lcl.fr',
  'Boursorama': 'boursorama.com',
  'Fortuneo': 'fortuneo.fr',
  'Hello Bank': 'hellobank.fr',
  'Caisse Epargne': 'caisse-epargne.fr',
  'Caisse d\'Epargne': 'caisse-epargne.fr',
  'Banque Populaire': 'banquepopulaire.fr',
  'La Banque Postale': 'labanquepostale.fr',
  'CIC': 'cic.fr',
  'Credit Mutuel': 'creditmutuel.fr',
  'Crédit Mutuel': 'creditmutuel.fr',
  'HSBC France': 'hsbc.fr',
  'AXA Banque': 'axabanque.fr',
  
  // Banks - Europe
  'HSBC': 'hsbc.com',
  'UBS': 'ubs.com',
  'Credit Suisse': 'credit-suisse.com',
  'Deutsche Bank': 'db.com',
  'Barclays': 'barclays.co.uk',
  'Santander': 'santander.com',
  'ING': 'ing.com',
  'Millennium BCP': 'millenniumbcp.pt',
  'Julius Baer': 'juliusbaer.com',
  'Pictet': 'pictet.com',
  'Lombard Odier': 'lombardodier.com',
  
  // Banks - US
  'Chase': 'chase.com',
  'JPMorgan': 'jpmorgan.com',
  'JP Morgan': 'jpmorgan.com',
  'Bank of America': 'bankofamerica.com',
  'Wells Fargo': 'wellsfargo.com',
  'Citi': 'citi.com',
  'Citibank': 'citibank.com',
  'Goldman Sachs': 'goldmansachs.com',
  'Morgan Stanley': 'morganstanley.com',
  
  // Banks - Other
  'Bank of Georgia': 'bankofgeorgia.ge',
  'TBC Bank': 'tbcbank.ge',
  'Sberbank': 'sberbank.ru',
  'Tinkoff': 'tinkoff.ru',
  'Alfa Bank': 'alfabank.ru',
  
  // Brokers & Investment
  'Interactive Brokers': 'interactivebrokers.com',
  'IBKR': 'interactivebrokers.com',
  'IB': 'interactivebrokers.com',
  'Swissquote': 'swissquote.com',
  'Degiro': 'degiro.com',
  'DEGIRO': 'degiro.com',
  'eToro': 'etoro.com',
  'Saxo Bank': 'home.saxo',
  'Saxo': 'home.saxo',
  'Charles Schwab': 'schwab.com',
  'Schwab': 'schwab.com',
  'Fidelity': 'fidelity.com',
  'Vanguard': 'vanguard.com',
  'Robinhood': 'robinhood.com',
  'Trade Republic': 'traderepublic.com',
  'Trading 212': 'trading212.com',
  'Scalable Capital': 'scalable.capital',
  
  // Fintech
  'Wise': 'wise.com',
  'Revolut': 'revolut.com',
  'N26': 'n26.com',
  'Monzo': 'monzo.com',
  'Starling': 'starlingbank.com',
  'Chime': 'chime.com',
  'Qonto': 'qonto.com',
  
  // Crypto Exchanges
  'Coinbase': 'coinbase.com',
  'Binance': 'binance.com',
  'Kraken': 'kraken.com',
  'Crypto.com': 'crypto.com',
  'Gemini': 'gemini.com',
  'Bitfinex': 'bitfinex.com',
  'Bitstamp': 'bitstamp.net',
  'KuCoin': 'kucoin.com',
  'OKX': 'okx.com',
  'Bybit': 'bybit.com',
  'Huobi': 'huobi.com',
  
  // Hardware Wallets
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
  'a16z': 'a16z.com',
  
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
