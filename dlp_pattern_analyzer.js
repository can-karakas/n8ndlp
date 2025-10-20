// ===== DLP PATTERN ANALYZER =====
// ONLY scans node.parameters for sensitive data patterns
const DLP_PATTERNS = {};
const rulesNode = $('Read DLP Rules');
for (const item of rulesNode.all()) {
const rule = item.json;
if (rule.Enabled !== true || !rule.Pattern) {
continue;
}
const category = rule.Category || 'general';
if (!DLP_PATTERNS[category]) {
DLP_PATTERNS[category] = {
patterns: [],
severity: rule.Severity || 'MEDIUM',
description: rule.Description || 'General Rule',
classification: rule.Classification || 'Unclassified',
risk_score: 8
};
}
try {
const regex = new RegExp(rule.Pattern, 'g');
DLP_PATTERNS[category].patterns.push(regex);
} catch (e) {
console.log(`Hatalı RegEx deseni göz ardı edildi: '${rule.Pattern}' - Hata: ${e.message}`);
}
}
const SKIP_NODE_TYPES = [
'n8n-nodes-base.stickyNote', 'n8n-nodes-base.noOp', 'n8n-nodes-base.if',
'n8n-nodes-base.scheduleTrigger', 'n8n-nodes-base.manualTrigger', 'n8n-nodes-base.start',
'n8n-nodes-base.stopAndError', 'n8n-nodes-base.merge', 'n8n-nodes-base.wait'
];
const DESTINATION_REGEX = /(https?:\/\/[^/s"'\<\>()[\]\\,;:]+|[a-zA-Z0–9.-]+\.[a-zA-Z]{2,}(?:\/[^/s"']*)?|\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)/g;
function findDestinationsInObject(obj) {
const destinations = new Set();
function traverse(currentObj) {
if (!currentObj) return;
if (typeof currentObj === 'string') {
const matches = currentObj.match(DESTINATION_REGEX);
if (matches) {
matches.forEach(dest => destinations.add(dest));
}
} else if (Array.isArray(currentObj)) {
currentObj.forEach(item => traverse(item));
} else if (typeof currentObj === 'object') {
Object.values(currentObj).forEach(value => traverse(value));
}
}
traverse(obj);
return Array.from(destinations);
}
function scanParametersForPatterns(params, patterns, nodeName, nodeType) {
const violations = [];
if (typeof params === 'string') {
const potentialDestinations = params.match(DESTINATION_REGEX) || [];
Object.entries(patterns).forEach(([category, cfg]) => {
cfg.patterns.forEach((re) => {
re.lastIndex = 0;
let match;
while ((match = re.exec(params)) !== null) {
const matchedValue = match[0];
violations.push({
category,
severity: cfg.severity,
description: cfg.description,
classification: cfg.classification,
nodeName,
nodeType,
matchedValue: matchedValue.substring(0, 50) + (matchedValue.length > 50 ? '…' : ''),
destination: potentialDestinations.length > 0 ? potentialDestinations.join(', ') : 'N/A',
});
}
});
});
} else if (params && typeof params === 'object') {
Object.values(params).forEach((v) => {
violations.push(…scanParametersForPatterns(v, patterns, nodeName, nodeType));
});
}
return violations;
}
function getWorkflowOwner(workflow) {
const shared = Array.isArray(workflow.shared) ? workflow.shared : [];
const ownerShare = shared.find(s => s.role === 'workflow:owner') || shared[0];
if (ownerShare?.user) {
const u = ownerShare.user;
if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
if (u.email) return u.email;
}
const relations = ownerShare?.project?.projectRelations;
if (Array.isArray(relations) && relations.length > 0) {
const ru = (relations.find(r => r?.user) || relations[0])?.user;
if (ru) {
if (ru.firstName && ru.lastName) return `${ru.firstName} ${ru.lastName}`;
if (ru.email) return ru.email;
}
}
if (workflow.creator && typeof workflow.creator === 'object') {
const c = workflow.creator;
if (c.firstName && c.lastName) return `${c.firstName} ${c.lastName}`;
if (c.email) return c.email;
}
return 'Owner Not Found';
}
const results = [];
let totalViolations = 0;
for (const item of $input.all()) {
const workflow = item.json;
const workflowId = workflow.id;
const workflowName = workflow.name;
const workflowOwner = getWorkflowOwner(workflow);
const workflowViolations = [];
if (Array.isArray(workflow.nodes)) {
for (const node of workflow.nodes) {
const nodeName = node.name || 'Unknown Node';
const nodeType = node.type || 'Unknown Type';
if (SKIP_NODE_TYPES.includes(nodeType)) continue;
if (node.parameters && typeof node.parameters === 'object') {
const nodeDestinations = findDestinationsInObject(node.parameters);
const nodeViolations = scanParametersForPatterns(node.parameters, DLP_PATTERNS, nodeName, nodeType);
for (const v of nodeViolations) {
workflowViolations.push({
workflowId,
workflowName,
workflowOwner,
nodeName: v.nodeName,
nodeType: v.nodeType,
violationType: v.description,
severity: v.severity,
category: v.category,
classification: v.classification,
matchedValue: v.matchedValue,
destination: nodeDestinations.length > 0 ? nodeDestinations.join(', ') : 'N/A',
destinationNodeName: nodeDestinations.length > 0 ? v.nodeName : 'N/A',
destinationNodeType: nodeDestinations.length > 0 ? v.nodeType : 'N/A',
});
}
}
}
}
if (workflowViolations.length > 0) {
results.push({
workflow_id: workflowId,
workflow_name: workflowName,
workflow_owner: workflowOwner,
violations: workflowViolations,
violation_count: workflowViolations.length,
});
totalViolations += workflowViolations.length;
}
}
return [{ json: { scan_results: results, total_violations: totalViolations } }];
