import React, { useState } from 'react';
import { BusinessSettings, SEOAnalysis, SEOIssue, PerformanceMetrics } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface WebsiteAnalysisProps {
  settings: BusinessSettings;
}

export const WebsiteAnalysis: React.FC<WebsiteAnalysisProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'seo' | 'performance' | 'tools'>('seo');
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSEOAnalysis = async () => {
    if (!analysisUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate API call to SEO analysis service
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockSEOAnalysis: SEOAnalysis = {
        url: analysisUrl,
        score: 78,
        issues: [
          {
            type: 'warning',
            category: 'technical',
            title: 'Missing meta description',
            description: 'The page is missing a meta description tag',
            impact: 'medium',
            howToFix: 'Add a meta description tag with 150-160 characters describing the page content'
          },
          {
            type: 'error',
            category: 'performance',
            title: 'Large image files',
            description: 'Several images are larger than recommended',
            impact: 'high',
            howToFix: 'Compress images and use modern formats like WebP'
          },
          {
            type: 'info',
            category: 'content',
            title: 'Good heading structure',
            description: 'The page has a proper H1-H6 heading hierarchy',
            impact: 'low',
            howToFix: 'No action needed - keep maintaining good heading structure'
          }
        ],
        recommendations: [
          {
            title: 'Improve page loading speed',
            description: 'Optimize images and minify CSS/JS files',
            priority: 'high',
            estimatedImpact: 'Could improve rankings and user experience',
            implementation: 'Use image compression tools and code minifiers'
          },
          {
            title: 'Add structured data',
            description: 'Implement schema markup for better search visibility',
            priority: 'medium',
            estimatedImpact: 'Enhanced search result appearance',
            implementation: 'Add JSON-LD structured data to pages'
          }
        ],
        keywords: [
          {
            keyword: 'business productivity',
            density: 2.3,
            position: 1,
            searchVolume: 12000,
            difficulty: 65,
            opportunities: ['Increase keyword density', 'Add to meta title']
          },
          {
            keyword: 'project management',
            density: 1.8,
            position: 3,
            searchVolume: 45000,
            difficulty: 78,
            opportunities: ['Create dedicated landing page', 'Add internal links']
          }
        ],
        performance: {
          loadTime: 2.8,
          firstContentfulPaint: 1.2,
          largestContentfulPaint: 2.5,
          cumulativeLayoutShift: 0.1,
          firstInputDelay: 45,
          mobileScore: 72,
          desktopScore: 85
        },
        lastAnalyzed: new Date()
      };

      setSeoAnalysis(mockSEOAnalysis);
      setPerformanceMetrics(mockSEOAnalysis.performance);
    } catch (err) {
      setError('Failed to analyze website. Please try again.');
      console.error('SEO analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePerformanceTest = async () => {
    if (!analysisUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate API call to performance testing service (GTmetrix, Pingdom, etc.)
      await new Promise(resolve => setTimeout(resolve, 4000));

      const mockPerformanceMetrics: PerformanceMetrics = {
        loadTime: 2.8,
        firstContentfulPaint: 1.2,
        largestContentfulPaint: 2.5,
        cumulativeLayoutShift: 0.1,
        firstInputDelay: 45,
        mobileScore: 72,
        desktopScore: 85
      };

      setPerformanceMetrics(mockPerformanceMetrics);
    } catch (err) {
      setError('Failed to test performance. Please try again.');
      console.error('Performance test error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderSEOAnalysis = () => (
    <div className="seo-analysis">
      <div className="analysis-input">
        <div className="input-group">
          <input 
            type="url"
            value={analysisUrl}
            onChange={(e) => setAnalysisUrl(e.target.value)}
            placeholder="Enter website URL to analyze"
            className="url-input"
          />
          <Button 
            onClick={handleSEOAnalysis}
            disabled={isAnalyzing}
            className="primary"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze SEO'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {seoAnalysis && (
        <div className="seo-results">
          <div className="seo-score">
            <div className="score-circle">
              <div className="score-value">{seoAnalysis.score}</div>
              <div className="score-label">SEO Score</div>
            </div>
            <div className="score-details">
              <div className="score-breakdown">
                <div className="breakdown-item">
                  <span className="label">Technical:</span>
                  <span className="value">Good</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Content:</span>
                  <span className="value">Excellent</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Performance:</span>
                  <span className="value">Needs Work</span>
                </div>
              </div>
            </div>
          </div>

          <div className="seo-issues">
            <h4>Issues Found</h4>
            <div className="issues-list">
              {seoAnalysis.issues.map((issue, index) => (
                <div key={index} className={`issue-item ${issue.type}`}>
                  <div className="issue-header">
                    <span className={`issue-type ${issue.type}`}>
                      {issue.type === 'error' && '❌'}
                      {issue.type === 'warning' && '⚠️'}
                      {issue.type === 'info' && 'ℹ️'}
                    </span>
                    <span className="issue-title">{issue.title}</span>
                    <span className={`issue-impact ${issue.impact}`}>
                      {issue.impact} impact
                    </span>
                  </div>
                  <div className="issue-description">{issue.description}</div>
                  <div className="issue-fix">
                    <strong>How to fix:</strong> {issue.howToFix}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="seo-recommendations">
            <h4>Recommendations</h4>
            <div className="recommendations-list">
              {seoAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <div className="rec-header">
                    <span className="rec-title">{rec.title}</span>
                    <span className={`rec-priority ${rec.priority}`}>
                      {rec.priority} priority
                    </span>
                  </div>
                  <div className="rec-description">{rec.description}</div>
                  <div className="rec-impact">
                    <strong>Expected impact:</strong> {rec.estimatedImpact}
                  </div>
                  <div className="rec-implementation">
                    <strong>Implementation:</strong> {rec.implementation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="keyword-analysis">
            <h4>Keyword Analysis</h4>
            <div className="keywords-table">
              <div className="table-header">
                <div>Keyword</div>
                <div>Density</div>
                <div>Position</div>
                <div>Search Volume</div>
                <div>Difficulty</div>
                <div>Opportunities</div>
              </div>
              {seoAnalysis.keywords.map((keyword, index) => (
                <div key={index} className="table-row">
                  <div>{keyword.keyword}</div>
                  <div>{keyword.density}%</div>
                  <div>#{keyword.position}</div>
                  <div>{keyword.searchVolume.toLocaleString()}</div>
                  <div>{keyword.difficulty}%</div>
                  <div>
                    {keyword.opportunities.map(opp => (
                      <span key={opp} className="opportunity-tag">{opp}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceAnalysis = () => (
    <div className="performance-analysis">
      <div className="analysis-input">
        <div className="input-group">
          <input 
            type="url"
            value={analysisUrl}
            onChange={(e) => setAnalysisUrl(e.target.value)}
            placeholder="Enter website URL to test performance"
            className="url-input"
          />
          <Button 
            onClick={handlePerformanceTest}
            disabled={isAnalyzing}
            className="primary"
          >
            {isAnalyzing ? 'Testing...' : 'Test Performance'}
          </Button>
        </div>
      </div>

      {performanceMetrics && (
        <div className="performance-results">
          <div className="performance-scores">
            <div className="score-card mobile">
              <h4>Mobile Score</h4>
              <div className={`score ${performanceMetrics.mobileScore >= 90 ? 'good' : performanceMetrics.mobileScore >= 50 ? 'average' : 'poor'}`}>
                {performanceMetrics.mobileScore}
              </div>
            </div>
            <div className="score-card desktop">
              <h4>Desktop Score</h4>
              <div className={`score ${performanceMetrics.desktopScore >= 90 ? 'good' : performanceMetrics.desktopScore >= 50 ? 'average' : 'poor'}`}>
                {performanceMetrics.desktopScore}
              </div>
            </div>
          </div>

          <div className="performance-metrics">
            <h4>Core Web Vitals</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <h5>First Contentful Paint</h5>
                <div className="metric-value">{performanceMetrics.firstContentfulPaint}s</div>
                <div className="metric-status good">Good</div>
              </div>
              <div className="metric-card">
                <h5>Largest Contentful Paint</h5>
                <div className="metric-value">{performanceMetrics.largestContentfulPaint}s</div>
                <div className="metric-status average">Needs Improvement</div>
              </div>
              <div className="metric-card">
                <h5>First Input Delay</h5>
                <div className="metric-value">{performanceMetrics.firstInputDelay}ms</div>
                <div className="metric-status good">Good</div>
              </div>
              <div className="metric-card">
                <h5>Cumulative Layout Shift</h5>
                <div className="metric-value">{performanceMetrics.cumulativeLayoutShift}</div>
                <div className="metric-status good">Good</div>
              </div>
            </div>
          </div>

          <div className="performance-recommendations">
            <h4>Performance Recommendations</h4>
            <div className="rec-list">
              <div className="rec-item">
                <span className="rec-icon">🖼️</span>
                <div className="rec-content">
                  <h5>Optimize Images</h5>
                  <p>Compress images and use modern formats like WebP to reduce load times</p>
                </div>
              </div>
              <div className="rec-item">
                <span className="rec-icon">⚡</span>
                <div className="rec-content">
                  <h5>Minify Resources</h5>
                  <p>Minify CSS, JavaScript, and HTML to reduce file sizes</p>
                </div>
              </div>
              <div className="rec-item">
                <span className="rec-icon">🚀</span>
                <div className="rec-content">
                  <h5>Enable Caching</h5>
                  <p>Implement browser caching to improve repeat visit performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalysisTools = () => (
    <div className="analysis-tools">
      <h3>Website Analysis Tools</h3>
      
      <div className="tools-grid">
        <div className="tool-category">
          <h4>SEO Analysis</h4>
          <div className="tool-list">
            <div className="tool-item">
              <h5>Google PageSpeed Insights</h5>
              <p>Analyze page performance and get optimization suggestions</p>
              <Button 
                onClick={() => window.open('https://pagespeed.web.dev/', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
            <div className="tool-item">
              <h5>GTmetrix</h5>
              <p>Comprehensive website performance analysis</p>
              <Button 
                onClick={() => window.open('https://gtmetrix.com/', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
            <div className="tool-item">
              <h5>SEO Site Checkup</h5>
              <p>Free SEO analysis and website audit</p>
              <Button 
                onClick={() => window.open('https://seositecheckup.com/', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
          </div>
        </div>

        <div className="tool-category">
          <h4>Performance Testing</h4>
          <div className="tool-list">
            <div className="tool-item">
              <h5>Pingdom</h5>
              <p>Website speed test and performance monitoring</p>
              <Button 
                onClick={() => window.open('https://tools.pingdom.com/', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
            <div className="tool-item">
              <h5>WebPageTest</h5>
              <p>Advanced web performance testing</p>
              <Button 
                onClick={() => window.open('https://www.webpagetest.org/', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
            <div className="tool-item">
              <h5>Lighthouse</h5>
              <p>Automated auditing for performance, accessibility, and SEO</p>
              <Button 
                onClick={() => window.open('https://developers.google.com/web/tools/lighthouse', '_blank')}
                className="tool-button"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        <div className="tool-category">
          <h4>SEO Tools</h4>
          <div className="tool-list">
            <div className="tool-item">
              <h5>Google Search Console</h5>
              <p>Monitor and maintain your site's presence in Google Search</p>
              <Button 
                onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
            <div className="tool-item">
              <h5>Ubersuggest</h5>
              <p>Keyword research and SEO analysis</p>
              <Button 
                onClick={() => window.open('https://neilpatel.com/ubersuggest/', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
            <div className="tool-item">
              <h5>Screaming Frog</h5>
              <p>SEO spider tool for technical SEO audits</p>
              <Button 
                onClick={() => window.open('https://www.screamingfrog.co.uk/seo-spider/', '_blank')}
                className="tool-button"
              >
                Open Tool
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="website-analysis">
      <div className="analysis-tabs">
        <Button 
          onClick={() => setActiveTab('seo')}
          className={`tab-button ${activeTab === 'seo' ? 'active' : ''}`}
        >
          SEO Analysis
        </Button>
        <Button 
          onClick={() => setActiveTab('performance')}
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
        >
          Performance Testing
        </Button>
        <Button 
          onClick={() => setActiveTab('tools')}
          className={`tab-button ${activeTab === 'tools' ? 'active' : ''}`}
        >
          Analysis Tools
        </Button>
      </div>

      <div className="analysis-content">
        {activeTab === 'seo' && renderSEOAnalysis()}
        {activeTab === 'performance' && renderPerformanceAnalysis()}
        {activeTab === 'tools' && renderAnalysisTools()}
      </div>
    </div>
  );
};