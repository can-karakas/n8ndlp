const scanTimestamp = new Date().toLocaleString('tr-TR', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});

const preparedForSheets = aggregatedGroups.map(item => {
  
  const uniqueMatches = [...new Set(item.details.map(d => d.matchedValue || 'N/A'))].join('\n');
  
  
  const truncatedMatches = uniqueMatches.length > 100 
    ? uniqueMatches.substring(0, 100) + '...' 
    : uniqueMatches;
  
  const uniqueDestinations = [...new Set(item.details.map(d => d.destination || 'N/A'))].join('\n');
  
  return {
    json: {
      "Execute Date": scanTimestamp,
      "Workflow ID": item.workflowId,
      "Workflow Name": item.workflowName,
      "Workflow Owner": item.workflowOwner,
      "Node Name": item.nodeName, 
      "Violation Type": item.violationType,
      "Risk Score": item.severity,
      "Classification": item.classification,
      "Count": item.count,
      "Matched Value": truncatedMatches,
      "Destination URL": uniqueDestinations,
      "URL Contains Node Count": item.destinationNodeName || 'N/A',
      "Destination Node Type": item.destinationNodeType || 'N/A' 
    }
  };
});

return preparedForSheets;
