import React, { useState } from 'react';
import { Calculator, TrendingUp, Clock } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { roiApi } from '../../services/comptabiliteApi';

const ROICalculator: React.FC = () => {
  const [investmentCost, setInvestmentCost] = useState<string>('');
  const [annualBenefit, setAnnualBenefit] = useState<string>('');
  const [years, setYears] = useState<number>(5);
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!investmentCost || !annualBenefit) return;

    try {
      setCalculating(true);
      const response = await roiApi.calculate({
        investment_cost: investmentCost,
        annual_benefit: annualBenefit,
        years,
      });
      setResult(response);
    } catch (error) {
      console.error('Error calculating ROI:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return isNaN(value) ? '0 DT' : `${value.toLocaleString('fr-FR')} DT`;
  };

  const formatPercent = (value: number) => {
    return isNaN(value) ? '0%' : `${value.toFixed(1)}%`;
  };

  const cumulativeBenefit = result ? result.annualBenefit * years : 0;
  const netBenefit = result ? cumulativeBenefit - result.investmentCost : 0;

  return (
    <Layout title="Calculateur ROI" subtitle="Calculez le retour sur investissement">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator size={28} />
          Calculateur ROI
        </h1>
        <p className="text-gray-500 mt-2">
          Calculez le retour sur investissement et le délai de remboursement de vos équipements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Paramètres</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coût d'Investissement (DT)
              </label>
              <input
                type="number"
                value={investmentCost}
                onChange={(e) => setInvestmentCost(e.target.value)}
                placeholder="Ex: 50000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bénéfice Annuel (DT)
              </label>
              <input
                type="number"
                value={annualBenefit}
                onChange={(e) => setAnnualBenefit(e.target.value)}
                placeholder="Ex: 15000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (années)
              </label>
              <select
                value={years}
                onChange={(e) => setYears(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={3}>3 ans</option>
                <option value={5}>5 ans</option>
                <option value={7}>7 ans</option>
                <option value={10}>10 ans</option>
              </select>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!investmentCost || !annualBenefit || calculating}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculating ? 'Calcul en cours...' : 'Calculer'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Résultats</h2>
          
          {result ? (
            <div className="space-y-6">
              {/* ROI */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp size={24} className="text-green-600" />
                  <div>
                    <div className="text-sm text-gray-600">Retour sur Investissement</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercent(result.roiPercent)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payback */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock size={24} className="text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Délai de Remboursement</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {result.paybackYears} ans
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coût initial:</span>
                    <span className="font-medium">{formatCurrency(result.investmentCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bénéfice annuel:</span>
                    <span className="font-medium">{formatCurrency(result.annualBenefit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sur {years} ans:</span>
                    <span className="font-medium">{formatCurrency(cumulativeBenefit)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-medium">Bénéfice net:</span>
                    <span className={`font-bold ${netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netBenefit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calculator size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Entrez les paramètres et cliquez sur "Calculer" pour voir les résultats</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ROICalculator;
