import React, { useState, useEffect } from 'react';
import { BusinessSuiteWorkspace, FinancialData, CryptocurrencyData, TradingPosition } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface FinancialManagementProps {
  workspace: BusinessSuiteWorkspace;
  onWorkspaceUpdate: (workspace: BusinessSuiteWorkspace) => void;
}

export const FinancialManagement: React.FC<FinancialManagementProps> = ({
  workspace,
  onWorkspaceUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'crypto' | 'trading' | 'invoices'>('overview');
  const [cryptoData, setCryptoData] = useState<CryptocurrencyData[]>([]);
  const [tradingPositions, setTradingPositions] = useState<TradingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'crypto') {
      fetchCryptocurrencyData();
    }
  }, [activeTab]);

  const fetchCryptocurrencyData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call to cryptocurrency service (CoinGecko, CryptoCompare, etc.)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockCryptoData: CryptocurrencyData[] = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 45250.30,
          change24h: 2.45,
          volume: 28500000000,
          marketCap: 850000000000
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3125.75,
          change24h: -1.23,
          volume: 15200000000,
          marketCap: 375000000000
        },
        {
          symbol: 'ADA',
          name: 'Cardano',
          price: 0.85,
          change24h: 5.67,
          volume: 2100000000,
          marketCap: 28500000000
        },
        {
          symbol: 'DOT',
          name: 'Polkadot',
          price: 18.45,
          change24h: -0.89,
          volume: 1800000000,
          marketCap: 18200000000
        },
        {
          symbol: 'LINK',
          name: 'Chainlink',
          price: 24.67,
          change24h: 3.21,
          volume: 1500000000,
          marketCap: 11500000000
        }
      ];
      
      setCryptoData(mockCryptoData);
    } catch (err) {
      setError('Failed to fetch cryptocurrency data');
      console.error('Crypto API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateInvoiceMetrics = () => {
    const totalRevenue = workspace.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingRevenue = workspace.invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const overdueRevenue = workspace.invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);

    return { totalRevenue, pendingRevenue, overdueRevenue };
  };

  const renderOverview = () => {
    const { totalRevenue, pendingRevenue, overdueRevenue } = calculateInvoiceMetrics();
    
    return (
      <div className="financial-overview">
        <div className="overview-cards">
          <div className="metric-card revenue">
            <h3>Total Revenue</h3>
            <div className="metric-value">${totalRevenue.toLocaleString()}</div>
            <div className="metric-change positive">+12.5% this month</div>
          </div>
          
          <div className="metric-card pending">
            <h3>Pending Revenue</h3>
            <div className="metric-value">${pendingRevenue.toLocaleString()}</div>
            <div className="metric-detail">{workspace.invoices.filter(i => i.status === 'sent').length} invoices</div>
          </div>
          
          <div className="metric-card overdue">
            <h3>Overdue Amount</h3>
            <div className="metric-value">${overdueRevenue.toLocaleString()}</div>
            <div className="metric-detail">{workspace.invoices.filter(i => i.status === 'overdue').length} invoices</div>
          </div>
          
          <div className="metric-card expenses">
            <h3>Monthly Expenses</h3>
            <div className="metric-value">$8,450</div>
            <div className="metric-change negative">+5.2% vs last month</div>
          </div>
        </div>
        
        <div className="financial-charts">
          <div className="chart-container">
            <h4>Revenue Trend</h4>
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <div className="chart-bar" style={{ height: '75%' }}></div>
              <div className="chart-bar" style={{ height: '45%' }}></div>
              <div className="chart-bar" style={{ height: '80%' }}></div>
              <div className="chart-bar" style={{ height: '90%' }}></div>
              <div className="chart-bar" style={{ height: '70%' }}></div>
            </div>
            <div className="chart-labels">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
          
          <div className="chart-container">
            <h4>Expense Breakdown</h4>
            <div className="pie-chart">
              <div className="pie-segment" style={{ '--percentage': '40%' } as React.CSSProperties}>
                Office Rent
              </div>
              <div className="pie-segment" style={{ '--percentage': '25%' } as React.CSSProperties}>
                Software
              </div>
              <div className="pie-segment" style={{ '--percentage': '20%' } as React.CSSProperties}>
                Marketing
              </div>
              <div className="pie-segment" style={{ '--percentage': '15%' } as React.CSSProperties}>
                Other
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCryptocurrency = () => (
    <div className="cryptocurrency-section">
      <div className="section-header">
        <h3>Cryptocurrency Market</h3>
        <Button onClick={fetchCryptocurrencyData} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="crypto-table">
        <div className="table-header">
          <div>Symbol</div>
          <div>Name</div>
          <div>Price</div>
          <div>24h Change</div>
          <div>Volume</div>
          <div>Market Cap</div>
        </div>
        
        {cryptoData.map(crypto => (
          <div key={crypto.symbol} className="table-row">
            <div className="crypto-symbol">{crypto.symbol}</div>
            <div>{crypto.name}</div>
            <div className="price">${crypto.price.toLocaleString()}</div>
            <div className={`change ${crypto.change24h >= 0 ? 'positive' : 'negative'}`}>
              {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
            </div>
            <div>${(crypto.volume / 1000000000).toFixed(2)}B</div>
            <div>${(crypto.marketCap / 1000000000).toFixed(2)}B</div>
          </div>
        ))}
      </div>
      
      <div className="crypto-tools">
        <h4>Cryptocurrency Tools</h4>
        <div className="tool-buttons">
          <Button 
            onClick={() => window.open('https://www.coingecko.com', '_blank')}
            className="tool-button"
          >
            CoinGecko Market Data
          </Button>
          <Button 
            onClick={() => window.open('https://coinmarketcap.com', '_blank')}
            className="tool-button"
          >
            CoinMarketCap
          </Button>
          <Button 
            onClick={() => window.open('https://www.tradingview.com/crypto/', '_blank')}
            className="tool-button"
          >
            TradingView Charts
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTrading = () => (
    <div className="trading-section">
      <div className="section-header">
        <h3>Trading Portfolio</h3>
        <Button className="primary">Add Position</Button>
      </div>
      
      <div className="portfolio-summary">
        <div className="summary-card">
          <h4>Portfolio Value</h4>
          <div className="value">$125,450</div>
          <div className="change positive">+$2,340 (+1.9%)</div>
        </div>
        
        <div className="summary-card">
          <h4>Total P&L</h4>
          <div className="value">+$15,230</div>
          <div className="change positive">+13.8%</div>
        </div>
        
        <div className="summary-card">
          <h4>Active Positions</h4>
          <div className="value">8</div>
          <div className="detail">6 profitable</div>
        </div>
      </div>
      
      <div className="positions-table">
        <div className="table-header">
          <div>Symbol</div>
          <div>Quantity</div>
          <div>Avg Price</div>
          <div>Current Price</div>
          <div>P&L</div>
          <div>P&L %</div>
          <div>Actions</div>
        </div>
        
        {/* Mock trading positions */}
        <div className="table-row">
          <div>BTC</div>
          <div>0.5</div>
          <div>$42,000</div>
          <div>$45,250</div>
          <div className="positive">+$1,625</div>
          <div className="positive">+7.7%</div>
          <div>
            <Button className="small">Sell</Button>
          </div>
        </div>
        
        <div className="table-row">
          <div>ETH</div>
          <div>5.2</div>
          <div>$3,200</div>
          <div>$3,126</div>
          <div className="negative">-$385</div>
          <div className="negative">-2.3%</div>
          <div>
            <Button className="small">Sell</Button>
          </div>
        </div>
      </div>
      
      <div className="trading-tools">
        <h4>Trading Tools</h4>
        <div className="tool-buttons">
          <Button 
            onClick={() => window.open('https://www.tradingview.com', '_blank')}
            className="tool-button"
          >
            TradingView
          </Button>
          <Button 
            onClick={() => window.open('https://coinbase.com/pro', '_blank')}
            className="tool-button"
          >
            Coinbase Pro
          </Button>
          <Button 
            onClick={() => window.open('https://www.binance.com', '_blank')}
            className="tool-button"
          >
            Binance
          </Button>
        </div>
      </div>
    </div>
  );

  const renderInvoiceFinancials = () => {
    const { totalRevenue, pendingRevenue, overdueRevenue } = calculateInvoiceMetrics();
    
    return (
      <div className="invoice-financials">
        <div className="financial-summary">
          <div className="summary-row">
            <span>Total Invoiced:</span>
            <span>${(totalRevenue + pendingRevenue + overdueRevenue).toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Paid:</span>
            <span className="positive">${totalRevenue.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Pending:</span>
            <span className="warning">${pendingRevenue.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Overdue:</span>
            <span className="negative">${overdueRevenue.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="invoice-breakdown">
          <h4>Invoice Status Breakdown</h4>
          <div className="status-chart">
            {workspace.invoices.map(invoice => (
              <div key={invoice.id} className={`invoice-bar ${invoice.status}`}>
                <span>{invoice.number}</span>
                <span>${invoice.total}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="payment-trends">
          <h4>Payment Trends</h4>
          <div className="trend-metrics">
            <div className="metric">
              <span>Average Payment Time:</span>
              <span>18 days</span>
            </div>
            <div className="metric">
              <span>Collection Rate:</span>
              <span>94%</span>
            </div>
            <div className="metric">
              <span>Average Invoice Value:</span>
              <span>${workspace.invoices.length > 0 ? (workspace.invoices.reduce((sum, inv) => sum + inv.total, 0) / workspace.invoices.length).toFixed(0) : '0'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="financial-management">
      <div className="financial-tabs">
        <Button 
          onClick={() => setActiveTab('overview')}
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </Button>
        <Button 
          onClick={() => setActiveTab('crypto')}
          className={`tab-button ${activeTab === 'crypto' ? 'active' : ''}`}
        >
          Cryptocurrency
        </Button>
        <Button 
          onClick={() => setActiveTab('trading')}
          className={`tab-button ${activeTab === 'trading' ? 'active' : ''}`}
        >
          Trading
        </Button>
        <Button 
          onClick={() => setActiveTab('invoices')}
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
        >
          Invoice Financials
        </Button>
      </div>
      
      <div className="financial-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'crypto' && renderCryptocurrency()}
        {activeTab === 'trading' && renderTrading()}
        {activeTab === 'invoices' && renderInvoiceFinancials()}
      </div>
    </div>
  );
};