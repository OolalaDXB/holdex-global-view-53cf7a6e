import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, convertToEUR, convertFromEUR, fallbackRates } from '@/lib/currency';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useReceivables } from '@/hooks/useReceivables';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CertaintyData {
  certain: number;
  contractual: number;
  probable: number;
  optional: number;
  total: number;
}

interface CategoryBreakdown {
  name: string;
  data: CertaintyData;
}

export function CertaintyReportPDF() {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: receivables = [] } = useReceivables();
  const { data: exchangeRates } = useExchangeRates();
  const { data: cryptoPrices } = useCryptoPrices();
  const { displayCurrency } = useCurrency();
  
  const rates = exchangeRates?.rates || fallbackRates;
  const prices = cryptoPrices || {};

  // Helper to get asset value with crypto prices
  const getAssetValue = (asset: typeof assets[0]) => {
    if (asset.type === 'crypto' && asset.ticker && asset.quantity) {
      const cryptoPrice = prices[asset.ticker.toUpperCase()];
      if (cryptoPrice) return cryptoPrice.price * asset.quantity;
    }
    return asset.current_value;
  };

  // Calculate certainty breakdown by category
  const calculateCertaintyData = (items: Array<{ certainty?: string | null; currency: string; value: number }>): CertaintyData => {
    const result = { certain: 0, contractual: 0, probable: 0, optional: 0, total: 0 };
    items.forEach(item => {
      const eurValue = convertToEUR(item.value, item.currency, rates);
      const displayValue = convertFromEUR(eurValue, displayCurrency, rates);
      const level = item.certainty || 'certain';
      if (level === 'certain') result.certain += displayValue;
      else if (level === 'contractual') result.contractual += displayValue;
      else if (level === 'probable') result.probable += displayValue;
      else if (level === 'optional') result.optional += displayValue;
      result.total += displayValue;
    });
    return result;
  };

  // Asset categories
  const realEstateData = calculateCertaintyData(
    assets.filter(a => a.type === 'real-estate').map(a => ({ certainty: a.certainty, currency: a.currency, value: getAssetValue(a) }))
  );
  const bankData = calculateCertaintyData(
    assets.filter(a => a.type === 'bank').map(a => ({ certainty: a.certainty, currency: a.currency, value: getAssetValue(a) }))
  );
  const investmentData = calculateCertaintyData(
    assets.filter(a => a.type === 'investment').map(a => ({ certainty: a.certainty, currency: a.currency, value: getAssetValue(a) }))
  );
  const cryptoData = calculateCertaintyData(
    assets.filter(a => a.type === 'crypto').map(a => ({ certainty: a.certainty, currency: a.currency, value: getAssetValue(a) }))
  );
  const businessData = calculateCertaintyData(
    assets.filter(a => a.type === 'business').map(a => ({ certainty: a.certainty, currency: a.currency, value: getAssetValue(a) }))
  );
  const collectionsData = calculateCertaintyData(
    collections.map(c => ({ certainty: (c as any).certainty || 'probable', currency: c.currency, value: c.current_value }))
  );
  const receivablesData = calculateCertaintyData(
    receivables.map(r => ({ certainty: r.certainty, currency: r.currency, value: r.current_balance }))
  );
  const liabilitiesData = calculateCertaintyData(
    liabilities.map(l => ({ certainty: l.certainty, currency: l.currency, value: l.current_balance }))
  );

  // Total assets
  const totalAssets: CertaintyData = {
    certain: realEstateData.certain + bankData.certain + investmentData.certain + cryptoData.certain + businessData.certain + collectionsData.certain + receivablesData.certain,
    contractual: realEstateData.contractual + bankData.contractual + investmentData.contractual + cryptoData.contractual + businessData.contractual + collectionsData.contractual + receivablesData.contractual,
    probable: realEstateData.probable + bankData.probable + investmentData.probable + cryptoData.probable + businessData.probable + collectionsData.probable + receivablesData.probable,
    optional: realEstateData.optional + bankData.optional + investmentData.optional + cryptoData.optional + businessData.optional + collectionsData.optional + receivablesData.optional,
    total: realEstateData.total + bankData.total + investmentData.total + cryptoData.total + businessData.total + collectionsData.total + receivablesData.total,
  };

  // Net worth by certainty
  const netWorthByCertainty: CertaintyData = {
    certain: totalAssets.certain - liabilitiesData.certain,
    contractual: totalAssets.contractual - liabilitiesData.contractual,
    probable: totalAssets.probable - liabilitiesData.probable,
    optional: totalAssets.optional - liabilitiesData.optional,
    total: totalAssets.total - liabilitiesData.total,
  };

  const confirmedNetWorth = netWorthByCertainty.certain + netWorthByCertainty.contractual;
  const projectedAddition = netWorthByCertainty.probable + netWorthByCertainty.optional;

  const categories: CategoryBreakdown[] = [
    { name: 'Real Estate', data: realEstateData },
    { name: 'Bank Accounts', data: bankData },
    { name: 'Investments', data: investmentData },
    { name: 'Digital Assets', data: cryptoData },
    { name: 'Business Equity', data: businessData },
    { name: 'Collections', data: collectionsData },
    { name: 'Receivables', data: receivablesData },
  ].filter(c => c.data.total > 0);

  const handleExport = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `certainty-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(contentRef.current).save();
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatValue = (value: number) => formatCurrency(value, displayCurrency);
  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown size={14} />
          Certainty Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Certainty Distribution Report</span>
            <Button onClick={handleExport} disabled={isExporting} size="sm" className="gap-2">
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div ref={contentRef} className="bg-white text-black p-8 font-sans text-sm">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-serif font-bold tracking-tight">CERTAINTY DISTRIBUTION REPORT</h1>
            <p className="text-gray-600 mt-1">As of {format(new Date(), 'MMMM d, yyyy')}</p>
            <p className="text-gray-500 text-xs mt-1">All values in {displayCurrency}</p>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">EXECUTIVE SUMMARY</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Confirmed Net Worth</p>
                <p className="text-2xl font-bold text-green-700">{formatValue(confirmedNetWorth)}</p>
                <p className="text-xs text-gray-500">Certain + Contractual</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Projected Addition</p>
                <p className="text-2xl font-bold text-blue-600">{formatValue(projectedAddition)}</p>
                <p className="text-xs text-gray-500">Probable + Optional</p>
              </div>
            </div>
          </div>

          {/* Net Worth Breakdown */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">NET WORTH BY CERTAINTY LEVEL</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2 font-semibold">Certainty Level</th>
                  <th className="text-right py-2 font-semibold">Assets</th>
                  <th className="text-right py-2 font-semibold">Liabilities</th>
                  <th className="text-right py-2 font-semibold">Net Value</th>
                  <th className="text-right py-2 font-semibold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">✓ Verified (Certain)</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.certain)}</td>
                  <td className="text-right py-2 tabular-nums text-red-600">({formatValue(liabilitiesData.certain)})</td>
                  <td className="text-right py-2 tabular-nums font-medium">{formatValue(netWorthByCertainty.certain)}</td>
                  <td className="text-right py-2 tabular-nums">{formatPercent(netWorthByCertainty.certain, netWorthByCertainty.total)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">📄 Committed (Contractual)</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.contractual)}</td>
                  <td className="text-right py-2 tabular-nums text-red-600">({formatValue(liabilitiesData.contractual)})</td>
                  <td className="text-right py-2 tabular-nums font-medium">{formatValue(netWorthByCertainty.contractual)}</td>
                  <td className="text-right py-2 tabular-nums">{formatPercent(netWorthByCertainty.contractual, netWorthByCertainty.total)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">〜 Estimated (Probable)</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.probable)}</td>
                  <td className="text-right py-2 tabular-nums text-red-600">({formatValue(liabilitiesData.probable)})</td>
                  <td className="text-right py-2 tabular-nums font-medium">{formatValue(netWorthByCertainty.probable)}</td>
                  <td className="text-right py-2 tabular-nums">{formatPercent(netWorthByCertainty.probable, netWorthByCertainty.total)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">○ Speculative (Optional)</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.optional)}</td>
                  <td className="text-right py-2 tabular-nums text-red-600">({formatValue(liabilitiesData.optional)})</td>
                  <td className="text-right py-2 tabular-nums font-medium">{formatValue(netWorthByCertainty.optional)}</td>
                  <td className="text-right py-2 tabular-nums">{formatPercent(netWorthByCertainty.optional, netWorthByCertainty.total)}</td>
                </tr>
                <tr className="border-t-2 border-black font-bold">
                  <td className="py-2">TOTAL</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.total)}</td>
                  <td className="text-right py-2 tabular-nums text-red-600">({formatValue(liabilitiesData.total)})</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(netWorthByCertainty.total)}</td>
                  <td className="text-right py-2 tabular-nums">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Asset Categories Breakdown */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">CERTAINTY BY ASSET CLASS</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2 font-semibold">Asset Class</th>
                  <th className="text-right py-2 font-semibold">Verified</th>
                  <th className="text-right py-2 font-semibold">Committed</th>
                  <th className="text-right py-2 font-semibold">Estimated</th>
                  <th className="text-right py-2 font-semibold">Speculative</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.name} className="border-b">
                    <td className="py-2">{category.name}</td>
                    <td className="text-right py-2 tabular-nums">{formatValue(category.data.certain)}</td>
                    <td className="text-right py-2 tabular-nums">{formatValue(category.data.contractual)}</td>
                    <td className="text-right py-2 tabular-nums">{formatValue(category.data.probable)}</td>
                    <td className="text-right py-2 tabular-nums">{formatValue(category.data.optional)}</td>
                    <td className="text-right py-2 tabular-nums font-medium">{formatValue(category.data.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td className="py-2">TOTAL ASSETS</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.certain)}</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.contractual)}</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.probable)}</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.optional)}</td>
                  <td className="text-right py-2 tabular-nums">{formatValue(totalAssets.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Liabilities */}
          {liabilitiesData.total > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">LIABILITIES BY CERTAINTY</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 font-semibold">Category</th>
                    <th className="text-right py-2 font-semibold">Verified</th>
                    <th className="text-right py-2 font-semibold">Committed</th>
                    <th className="text-right py-2 font-semibold">Estimated</th>
                    <th className="text-right py-2 font-semibold">Speculative</th>
                    <th className="text-right py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b font-medium">
                    <td className="py-2">All Liabilities</td>
                    <td className="text-right py-2 tabular-nums text-red-600">{formatValue(liabilitiesData.certain)}</td>
                    <td className="text-right py-2 tabular-nums text-red-600">{formatValue(liabilitiesData.contractual)}</td>
                    <td className="text-right py-2 tabular-nums text-red-600">{formatValue(liabilitiesData.probable)}</td>
                    <td className="text-right py-2 tabular-nums text-red-600">{formatValue(liabilitiesData.optional)}</td>
                    <td className="text-right py-2 tabular-nums text-red-600 font-bold">{formatValue(liabilitiesData.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-8 text-xs text-gray-500">
            <p>This report is for informational purposes only. Certainty levels are user-assigned estimates.</p>
            <p className="mt-1">Generated by HOLDEX • {format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
