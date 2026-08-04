// utils/emailTemplate.js

const getDocumentEmailHTML = ({ documentTitle, preparedFor, totalCost, sentDate }) => {
  const formattedCost = (totalCost || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const dateStr = sentDate ? new Date(sentDate).toLocaleDateString() : new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
          }
          .header {
            background-color: #1e293b;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 30px;
            color: #334155;
            line-height: 1.6;
          }
          .card {
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
          }
          .card-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .card-row:last-child {
            margin-bottom: 0;
          }
          .label {
            color: #64748b;
            font-weight: 500;
          }
          .value {
            color: #0f172a;
            font-weight: 600;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Document Delivery</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your requested document has been generated and is attached to this email as a PDF.</p>
            
            <div class="card">
              <div class="card-row">
                <span class="label">Document Title:</span>
                <span class="value">${documentTitle || 'Agreement'}</span>
              </div>
              <div class="card-row">
                <span class="label">Prepared For:</span>
                <span class="value">${preparedFor || 'Valued Client'}</span>
              </div>
              <div class="card-row">
                <span class="label">Total Amount:</span>
                <span class="value">${formattedCost}</span>
              </div>
              <div class="card-row">
                <span class="label">Date Sent:</span>
                <span class="value">${dateStr}</span>
              </div>
            </div>

            <p style="font-size: 13px; color: #64748b;">
              Please review the attached PDF document for full breakdown and details.
            </p>
          </div>
          <div class="footer">
            Sent automatically via Smart Document Generator • Please do not reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = { getDocumentEmailHTML };   