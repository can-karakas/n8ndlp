# n8ndlp
This project creates a DLP system using N8N's own capabilities to prevent data leakage on N8N platforms.

Step-by-Step Setup

1. Trigger and Rules: 
  - Create a trigger in N8N for daily automated scans.
  - Prepare a Google Sheet with RegEx rules for sensitive data patterns.
  - Configure a node in N8N to read these rules.
  - Set up a Service Account or OAuth 2.0 credentials for N8N.
  - Tip 1: Create a sheet using the exact column headers shown in the screenshot below to ensure the workflow can read the rules correctly. (You can use Sample N8N Sheet.xlsx file)
  - Tip 2: You must configure Service Account or OAuth 2.0 credentials within n8n. For automated, server-side workflows like this, using a Service Account is the recommended approach.
  - You can create the necessary credentials for your project in the Google Cloud Console: https://console.cloud.google.com/apis/credentials


2. Data Collection and Analysis
  - Fetch all active workflows via the N8N API.
  - Pull the detailed configuration (nodes, connections, credentials) of each workflow.
  - Scan parameters with custom JavaScript code (dlp_pattern_analyzer.js). Identify potential data destinations and create violation records.

4. Violation Processing:
  - Reduce noise by grouping similar violations. (aggregator.js)
  - Format violation data into a standard format for reporting. (format_violations.js)
  - Add hashes to violations and remove duplicates to prevent recurring alerts.

5. Reporting and Response:
  - Integrate with Google Sheets to maintain an audit trail of all violations.
  - Tip: All you need to do is create a new, empty Google Sheet (like sample sheet file included on this project) and provide its URL to “Append Sheet” node.

Optional responses:
  - Send real-time Slack notifications to security teams (including risk levels and links to detailed logs). (use prepare_slack_message.js)
  - Tip: To allow your workflow to send notifications, you’ll need to create a Slack OAuth 2.0 credential.Create a new Slack App from api.slack.com/apps, Under “OAuth & Permissions,” add the necessary Scopes and paste “Client ID” and “Client Secret” to n8n Slack Credentials.
  - Integrate with a ticket management system like Jira or export to SIEM/SOAR products.
  - Advanced prevention, automatically deactivate workflows containing violations. (Use deactive workflow node on N8N)

# Please feel free to contact if you require any further information.
Linkedin: https://www.linkedin.com/in/cankarakas/
