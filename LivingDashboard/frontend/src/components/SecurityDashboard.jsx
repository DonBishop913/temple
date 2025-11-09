import { useEffect, useState } from "react";

function SecurityDashboard() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [securityMetrics, setSecurityMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch npm audit results
      const npmResponse = await fetch('/api/security/npm-audit');
      const npmData = await npmResponse.json();

      // Fetch pip audit results
      const pipResponse = await fetch('/api/security/pip-audit');
      const pipData = await pipResponse.json();

      // Combine and process vulnerability data
      const allVulnerabilities = [
        ...processNpmVulnerabilities(npmData),
        ...processPipVulnerabilities(pipData)
      ];

      setVulnerabilities(allVulnerabilities);

      // Calculate security metrics
      setSecurityMetrics({
        totalVulnerabilities: allVulnerabilities.length,
        criticalCount: allVulnerabilities.filter(v => v.severity === 'critical').length,
        highCount: allVulnerabilities.filter(v => v.severity === 'high').length,
        moderateCount: allVulnerabilities.filter(v => v.severity === 'moderate').length,
        lowCount: allVulnerabilities.filter(v => v.severity === 'low').length,
        lastScan: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processNpmVulnerabilities = (data) => {
    if (!data.vulnerabilities) return [];

    return Object.entries(data.vulnerabilities).map(([id, vuln]) => ({
      id,
      package: vuln.name,
      version: vuln.range,
      severity: vuln.severity,
      title: vuln.title,
      url: vuln.url,
      source: 'npm',
      fixAvailable: vuln.fixAvailable || false
    }));
  };

  const processPipVulnerabilities = (data) => {
    if (!Array.isArray(data)) return [];

    return data.flatMap(pkg =>
      pkg.vulns.map(vuln => ({
        id: vuln.id,
        package: pkg.name,
        version: pkg.version,
        severity: mapPipSeverity(vuln.severity),
        title: vuln.description,
        url: vuln.references?.[0]?.url,
        source: 'pip',
        fixAvailable: vuln.fix_versions && vuln.fix_versions.length > 0
      }))
    );
  };

  const mapPipSeverity = (severity) => {
    const severityMap = {
      'CRITICAL': 'critical',
      'HIGH': 'high',
      'MODERATE': 'moderate',
      'LOW': 'low'
    };
    return severityMap[severity] || 'unknown';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-600 bg-red-100',
      high: 'text-orange-600 bg-orange-100',
      moderate: 'text-yellow-600 bg-yellow-100',
      low: 'text-green-600 bg-green-100'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      moderate: '⚡',
      low: 'ℹ️'
    };
    return icons[severity] || '❓';
  };

  if (loading) {
    return (
      <div className="security-dashboard p-6">
        <h2 className="text-2xl font-bold mb-6">Security Dashboard</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="security-dashboard p-6">
      <h2 className="text-2xl font-bold mb-6">Security Dashboard</h2>

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Total Vulnerabilities</h3>
          <p className="text-3xl font-bold text-red-600">{securityMetrics.totalVulnerabilities}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Critical</h3>
          <p className="text-3xl font-bold text-red-600">{securityMetrics.criticalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">High</h3>
          <p className="text-3xl font-bold text-orange-600">{securityMetrics.highCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Last Scan</h3>
          <p className="text-sm text-gray-600">
            {new Date(securityMetrics.lastScan).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Vulnerability Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Vulnerability Details</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {vulnerabilities.length === 0 ? (
            <div className="p-4 text-center text-green-600">
              ✅ No vulnerabilities detected
            </div>
          ) : (
            <div className="divide-y">
              {vulnerabilities.map((vuln, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getSeverityIcon(vuln.severity)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{vuln.source}</span>
                      </div>
                      <h4 className="font-medium text-gray-900">{vuln.package} {vuln.version}</h4>
                      <p className="text-sm text-gray-600 mt-1">{vuln.title}</p>
                      {vuln.url && (
                        <a
                          href={vuln.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      {vuln.fixAvailable && (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Fix Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Security Recommendations</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Run security scans regularly (automated in CI/CD)</li>
          <li>• Address critical and high-severity vulnerabilities immediately</li>
          <li>• Keep dependencies updated with `npm audit fix` and `pip install --upgrade`</li>
          <li>• Review IPFS migration plan for parse-duration vulnerability</li>
          <li>• Monitor ecdsa vulnerability (documented as acceptable risk)</li>
        </ul>
      </div>
    </div>
  );
}

export default SecurityDashboard;