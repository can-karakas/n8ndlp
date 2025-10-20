const totalViolations = items.length;
const totalCritical = items.filter(item => item.json['Risk Score'] === 'CRITICAL').length;
const totalHigh = items.filter(item => item.json['Risk Score'] === 'HIGH').length;
const totalMedium = items.filter(item => item.json['Risk Score'] === 'MEDIUM').length;
const totalLow = items.filter(item => item.json['Risk Score'] === 'LOW').length;

const ozet = {
  toplam: totalViolations,
  critical: totalCritical,
  high: totalHigh,
  med: totalMedium, 
  low: totalLow
};

return [{
  json: ozet
}];
