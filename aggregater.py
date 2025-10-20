// ===== DLP ALERT FORMATTER =====
// Groups violations and creates a summary object for downstream nodes.

function collectViolations() {
  const out = [];
  for (const item of $input.all()) {
    const j = item.json;
    if (Array.isArray(j)) out.push(...j);
    else if (Array.isArray(j.violations)) out.push(...j.violations);
    else if (Array.isArray(j.scan_results)) {
        for (const w of j.scan_results) {
            if (Array.isArray(w.violations)) {
                out.push(...w.violations);
            }
        }
    }
    else if (j && typeof j === 'object') out.push(j);
  }
  return out;
}

const violations = collectViolations();

// Group by workflowId + nodeName + violationType
const groupedMap = new Map();
for (const v of violations) {
  const key = `${v.workflowId}|${v.nodeName}|${v.violationType}`;
  if (!groupedMap.has(key)) {
    groupedMap.set(key, { 
      workflowId: v.workflowId,
      workflowName: v.workflowName,
      workflowOwner: v.workflowOwner,
      nodeName: v.nodeName,
      violationType: v.violationType,
      severity: v.severity,
      classification: v.classification,
      destinationNodeName: v.destinationNodeName, 
      destinationNodeType: v.destinationNodeType, 
      count: 0,
      details: [] 
    });
  }
  const group = groupedMap.get(key);
  group.count += 1;
  
  group.details.push({
    matchedValue: v.matchedValue,
    destination: v.destination
  });
}
const aggregatedGroups = Array.from(groupedMap.values());

// Calculate severity counts and totals
let totalViolations = 0;
let criticalCount = 0;
let highCount = 0;
let mediumCount = 0;
let lowCount = 0;

for (const g of aggregatedGroups) {
  totalViolations += g.count;
  if (g.severity === "CRITICAL") criticalCount += g.count;
  else if (g.severity === "HIGH") highCount += g.count;
  else if (g.severity === "MEDIUM") mediumCount += g.count;
  else lowCount += g.count;
}

// Group by workflow to get the affected workflows count
const workflowsMap = new Map();
for (const g of aggregatedGroups) {
  if (!workflowsMap.has(g.workflowId)) {
    workflowsMap.set(g.workflowId, true);
  }
}

const summary = {
  totalViolations,
  affectedWorkflowsCount: workflowsMap.size,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
};

// Return the essential data for the Slack and Google Sheets nodes
return [{ 
  json: { 
    summary: summary,
    aggregatedGroups: aggregatedGroups,
    scanTimestamp: new Date().toISOString()
  } 
}];
