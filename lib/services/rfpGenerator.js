/**
 * RFP Document Generator Service
 * 
 * Generates professional Request for Proposal documents with compliance context
 */

export class RFPGenerator {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Generate a complete RFP document
   */
  async generateRFP(rfpProjectId) {
    try {
      // Get RFP project data with all related information
      const rfpData = await this.getRFPData(rfpProjectId);

      if (!rfpData) {
        throw new Error('RFP project not found');
      }

      // Generate the main RFP document
      const rfpDocument = await this.generateMainRFPDocument(rfpData);

      // Generate vendor invitation template
      const invitationTemplate = await this.generateVendorInvitation(rfpData);

      // Save documents to database (no evaluation sheet - that's a separate page)
      await this.saveRFPDocuments(rfpProjectId, {
        rfpDocument,
        invitationTemplate
      });

      return {
        success: true,
        documents: {
          rfp: rfpDocument,
          invitation: invitationTemplate
        }
      };

    } catch (error) {
      console.error('RFP Generation Error:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive RFP data including property and compliance info
   */
  async getRFPData(rfpProjectId) {
    const { data: rfp, error: rfpError } = await this.supabase
      .from('rfp_projects')
      .select(`
        *,
        properties (
          id, address, city, state, zip_code, property_type,
          compliance_score, active_violations
        ),
        compliance_reports (
          id, report_data, compliance_score, overall_score, created_at
        )
      `)
      .eq('id', rfpProjectId)
      .single();

    if (rfpError) throw rfpError;
    return rfp;
  }

  /**
   * Generate the main RFP document as HTML
   */
  async generateMainRFPDocument(rfpData) {
    const { properties, compliance_reports } = rfpData;
    const complianceData = compliance_reports?.report_data || {};

    const executiveSummary = this.generateExecutiveSummary(rfpData, properties, complianceData);
    const complianceContext = this.generateComplianceContext(rfpData, complianceData);
    const proposalRequirements = this.generateProposalRequirements();
    const evaluationCriteria = this.generateEvaluationCriteria();
    const termsAndConditions = this.generateTermsAndConditions();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request for Proposal: ${rfpData.project_title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 8px;
      margin: -60px -60px 40px -60px;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header .subtitle { opacity: 0.9; font-size: 14px; }
    .section { margin: 40px 0; }
    .section h2 {
      color: #667eea;
      font-size: 24px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .section h3 {
      color: #764ba2;
      font-size: 18px;
      margin: 20px 0 10px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .info-item {
      padding: 15px;
      background: #f1f5f9;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    .info-item label {
      display: block;
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-item .value {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background: #e0e7ff;
      color: #667eea;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      margin: 4px;
    }
    .badge.critical { background: #fee2e2; color: #dc2626; }
    .badge.high { background: #fef3c7; color: #d97706; }
    ul { padding-left: 25px; margin: 15px 0; }
    li { margin: 8px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; padding: 40px; }
      .header { margin: -40px -40px 40px -40px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request for Proposal</h1>
      <h2 style="margin: 10px 0; font-size: 28px;">${rfpData.project_title}</h2>
      <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2>Executive Summary</h2>
      <p>${executiveSummary.overview}</p>

      <div class="info-grid" style="margin-top: 20px;">
        <div class="info-item">
          <label>Compliance Score</label>
          <div class="value">${executiveSummary.complianceStatus.score}% - ${executiveSummary.complianceStatus.status}</div>
        </div>
        <div class="info-item">
          <label>Active Violations</label>
          <div class="value">${executiveSummary.complianceStatus.violations}</div>
        </div>
      </div>

      <p style="margin-top: 15px;"><strong>Urgency:</strong> ${executiveSummary.urgency}</p>
      <p><strong>Budget:</strong> ${executiveSummary.budgetRange}</p>
      <p><strong>Timeline:</strong> ${executiveSummary.timeline}</p>
    </div>

    <!-- Project Information -->
    <div class="section">
      <h2>Project Information</h2>

      <h3>Property Details</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>Address</label>
          <div class="value">${properties.address}</div>
        </div>
        <div class="info-item">
          <label>Location</label>
          <div class="value">${properties.city}, ${properties.state} ${properties.zip_code}</div>
        </div>
        <div class="info-item">
          <label>Property Type</label>
          <div class="value">${properties.property_type || 'N/A'}</div>
        </div>
        <div class="info-item">
          <label>Urgency Level</label>
          <div class="value">${rfpData.urgency_level}</div>
        </div>
      </div>

      <h3>Project Description</h3>
      <p>${rfpData.project_description}</p>
    </div>

    <!-- Scope of Work -->
    <div class="section">
      <h2>Scope of Work</h2>
      <p style="white-space: pre-wrap;">${rfpData.scope_of_work}</p>

      ${rfpData.technical_requirements ? `
        <h3>Technical Requirements</h3>
        <p style="white-space: pre-wrap;">${rfpData.technical_requirements}</p>
      ` : ''}

      ${rfpData.materials_specifications ? `
        <h3>Materials & Specifications</h3>
        <p style="white-space: pre-wrap;">${rfpData.materials_specifications}</p>
      ` : ''}

      ${rfpData.quality_standards ? `
        <h3>Quality Standards</h3>
        <p style="white-space: pre-wrap;">${rfpData.quality_standards}</p>
      ` : ''}
    </div>

    <!-- Compliance Context -->
    ${rfpData.compliance_issues && rfpData.compliance_issues.length > 0 ? `
    <div class="section">
      <h2>Compliance Context</h2>

      <h3>Compliance Issues to Address</h3>
      <div>
        ${rfpData.compliance_issues.map(issue => `<span class="badge critical">${issue}</span>`).join('')}
      </div>

      ${rfpData.regulatory_requirements ? `
        <h3>Regulatory Requirements</h3>
        <p>${rfpData.regulatory_requirements}</p>
      ` : ''}

      ${rfpData.permit_requirements ? `
        <h3>Permit Requirements</h3>
        <p>${rfpData.permit_requirements}</p>
      ` : ''}

      ${rfpData.inspection_requirements ? `
        <h3>Inspection Requirements</h3>
        <p>${rfpData.inspection_requirements}</p>
      ` : ''}
    </div>
    ` : ''}

    <!-- Proposal Requirements -->
    <div class="section">
      <h2>Proposal Requirements</h2>

      <h3>Required Sections</h3>
      <ul>
        ${proposalRequirements.requiredSections.map(section => `<li>${section}</li>`).join('')}
      </ul>

      <h3>Submission Requirements</h3>
      <ul>
        ${proposalRequirements.submissionRequirements.map(req => `<li>${req}</li>`).join('')}
      </ul>
    </div>

    <!-- Evaluation Criteria -->
    <div class="section">
      <h2>Evaluation Criteria</h2>
      <table>
        <thead>
          <tr>
            <th>Criteria</th>
            <th>Weight</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Technical Competency</strong></td>
            <td>${evaluationCriteria.technicalCompetency.weight}%</td>
            <td>${evaluationCriteria.technicalCompetency.criteria.join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Cost Competitiveness</strong></td>
            <td>${evaluationCriteria.costCompetitiveness.weight}%</td>
            <td>${evaluationCriteria.costCompetitiveness.criteria.join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Timeline Feasibility</strong></td>
            <td>${evaluationCriteria.timelineFeasibility.weight}%</td>
            <td>${evaluationCriteria.timelineFeasibility.criteria.join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Vendor Qualifications</strong></td>
            <td>${evaluationCriteria.vendorQualifications.weight}%</td>
            <td>${evaluationCriteria.vendorQualifications.criteria.join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Compliance Approach</strong></td>
            <td>${evaluationCriteria.complianceApproach.weight}%</td>
            <td>${evaluationCriteria.complianceApproach.criteria.join(', ')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Terms and Conditions -->
    <div class="section">
      <h2>Terms and Conditions</h2>

      <h3>General Terms</h3>
      <ul>
        ${termsAndConditions.generalTerms.map(term => `<li>${term}</li>`).join('')}
      </ul>

      <h3>Compliance Terms</h3>
      <ul>
        ${termsAndConditions.complianceTerms.map(term => `<li>${term}</li>`).join('')}
      </ul>

      <h3>Liability & Warranty</h3>
      <ul>
        ${termsAndConditions.liabilityTerms.map(term => `<li>${term}</li>`).join('')}
      </ul>
    </div>

    <div class="footer">
      <p><strong>Propply AI</strong> - Property Compliance Management Platform</p>
      <p style="margin-top: 10px;">This is an official Request for Proposal document. All information is confidential.</p>
    </div>
  </div>
</body>
</html>
    `;

    return {
      html,
      title: `Request for Proposal: ${rfpData.project_title}`,
      format: 'html'
    };
  }

  /**
   * Generate executive summary with compliance context
   */
  generateExecutiveSummary(rfpData, property, complianceData) {
    const complianceScore = property.compliance_score || 0;
    const activeViolations = property.active_violations || 0;
    
    return {
      overview: `This Request for Proposal (RFP) seeks qualified contractors to perform ${rfpData.project_description.toLowerCase()} at ${property.address}.`,
      
      complianceStatus: {
        score: complianceScore,
        violations: activeViolations,
        status: complianceScore >= 80 ? 'Good' : complianceScore >= 60 ? 'Fair' : 'Needs Attention'
      },
      
      urgency: rfpData.urgency_level === 'critical' 
        ? 'This project addresses critical compliance issues requiring immediate attention.'
        : rfpData.urgency_level === 'high'
        ? 'This project addresses high-priority compliance issues with tight deadlines.'
        : 'This is a standard project with normal timeline requirements.',
      
      budgetRange: rfpData.budget_range_min && rfpData.budget_range_max
        ? `Budget range: $${rfpData.budget_range_min.toLocaleString()} - $${rfpData.budget_range_max.toLocaleString()}`
        : 'Budget to be determined based on proposals',
      
      timeline: rfpData.project_timeline_days 
        ? `Project duration: ${rfpData.project_timeline_days} days`
        : 'Timeline to be determined based on proposals'
    };
  }

  /**
   * Generate compliance context section
   */
  generateComplianceContext(rfpData, complianceData) {
    const context = {
      propertyComplianceScore: complianceData.compliance_score || 0,
      criticalIssues: [],
      violations: [],
      permits: [],
      equipment: []
    };

    // Extract critical compliance issues
    if (complianceData.data) {
      // HPD Violations (NYC)
      if (complianceData.data.hpd_violations) {
        context.violations.push(...complianceData.data.hpd_violations.slice(0, 5));
      }
      
      // DOB Violations (NYC)
      if (complianceData.data.dob_violations) {
        context.violations.push(...complianceData.data.dob_violations.slice(0, 5));
      }
      
      // L&I Violations (Philadelphia)
      if (complianceData.data.li_violations) {
        context.violations.push(...complianceData.data.li_violations.slice(0, 5));
      }
      
      // Recent Permits
      if (complianceData.data.li_permits) {
        context.permits.push(...complianceData.data.li_permits.slice(0, 3));
      }
      
      // Equipment
      if (complianceData.data.elevator_data) {
        context.equipment.push(...complianceData.data.elevator_data.slice(0, 3));
      }
    }

    return context;
  }

  /**
   * Generate proposal requirements
   */
  generateProposalRequirements() {
    return {
      requiredSections: [
        'Executive Summary',
        'Technical Approach',
        'Project Timeline',
        'Cost Breakdown',
        'Vendor Qualifications',
        'References',
        'Compliance Approach',
        'Permit Handling'
      ],
      
      submissionRequirements: [
        'Proposal must be submitted in PDF format',
        'All costs must be itemized and detailed',
        'Timeline must include milestones and dependencies',
        'Vendor must provide proof of insurance and licensing',
        'References must include contact information',
        'Compliance approach must address all regulatory requirements'
      ],
      
      evaluationFactors: [
        'Technical competency (30%)',
        'Cost competitiveness (25%)',
        'Timeline feasibility (20%)',
        'Vendor qualifications (15%)',
        'Compliance approach (10%)'
      ]
    };
  }

  /**
   * Generate evaluation criteria
   */
  generateEvaluationCriteria() {
    return {
      technicalCompetency: {
        weight: 30,
        criteria: [
          'Understanding of project requirements',
          'Technical approach and methodology',
          'Quality assurance processes',
          'Innovation and efficiency'
        ]
      },
      
      costCompetitiveness: {
        weight: 25,
        criteria: [
          'Total project cost',
          'Cost per unit of work',
          'Value for money',
          'Hidden or additional costs'
        ]
      },
      
      timelineFeasibility: {
        weight: 20,
        criteria: [
          'Realistic project timeline',
          'Milestone planning',
          'Resource allocation',
          'Risk mitigation'
        ]
      },
      
      vendorQualifications: {
        weight: 15,
        criteria: [
          'Relevant experience',
          'Licensing and certifications',
          'Insurance coverage',
          'References and reputation'
        ]
      },
      
      complianceApproach: {
        weight: 10,
        criteria: [
          'Understanding of regulatory requirements',
          'Permit handling approach',
          'Inspection coordination',
          'Compliance documentation'
        ]
      }
    };
  }

  /**
   * Generate terms and conditions
   */
  generateTermsAndConditions() {
    return {
      generalTerms: [
        'Contractor must maintain all required licenses and insurance',
        'All work must comply with local building codes and regulations',
        'Contractor is responsible for obtaining all necessary permits',
        'Work must be completed within agreed timeline',
        'Payment terms: 50% upfront, 50% upon completion'
      ],
      
      complianceTerms: [
        'Contractor must coordinate with local inspection authorities',
        'All work must pass required inspections',
        'Contractor must provide compliance documentation',
        'Any violations must be corrected at contractor expense',
        'Final inspection must be completed before final payment'
      ],
      
      liabilityTerms: [
        'Contractor assumes full liability for work performed',
        'Contractor must carry minimum $1M general liability insurance',
        'Contractor responsible for any damages to property',
        'Warranty period: 1 year from completion date',
        'Contractor must provide warranty documentation'
      ]
    };
  }

  /**
   * Generate vendor invitation template as HTML email
   */
  async generateVendorInvitation(rfpData) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RFP Invitation: ${rfpData.project_title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">RFP Invitation</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${rfpData.project_title}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">Dear Vendor,</p>

              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                You are invited to submit a proposal for the following project:
              </p>

              <!-- Project Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Project:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${rfpData.project_title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Property:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${rfpData.properties.address}, ${rfpData.properties.city}, ${rfpData.properties.state}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Project Type:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${rfpData.project_type.replace(/_/g, ' ')}</td>
                      </tr>
                      ${rfpData.project_timeline_days ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Timeline:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${rfpData.project_timeline_days} days</td>
                      </tr>
                      ` : ''}
                      ${rfpData.budget_range_min && rfpData.budget_range_max ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Budget Range:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">$${rfpData.budget_range_min.toLocaleString()} - $${rfpData.budget_range_max.toLocaleString()}</td>
                      </tr>
                      ` : ''}
                      ${rfpData.deadline_date ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Deadline:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${new Date(rfpData.deadline_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Compliance Context -->
              ${rfpData.properties.compliance_score ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #d97706; border-radius: 4px;">
                <p style="margin: 0; color: #78350f; font-size: 14px; font-weight: 600;">⚠️ Compliance Context</p>
                <p style="margin: 5px 0 0 0; color: #78350f; font-size: 14px;">
                  This project addresses compliance issues at a property with a compliance score of ${rfpData.properties.compliance_score}% and ${rfpData.properties.active_violations} active violations.
                </p>
              </div>
              ` : ''}

              <!-- Next Steps -->
              <h2 style="margin: 30px 0 15px 0; color: #1e293b; font-size: 18px;">Next Steps</h2>
              <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #1e293b; font-size: 15px; line-height: 1.8;">
                <li>Review the complete RFP document attached</li>
                <li>Submit your proposal ${rfpData.deadline_date ? `by ${new Date(rfpData.deadline_date).toLocaleDateString()}` : 'as soon as possible'}</li>
                <li>Include all required documentation and certifications</li>
                <li>Contact us with any questions or clarifications needed</li>
              </ol>

              <p style="margin: 20px 0 0 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                We look forward to receiving your proposal.
              </p>

              <p style="margin: 20px 0 0 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>Propply AI Property Management Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                This is an official RFP invitation from Propply AI<br>
                Property Compliance Management Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return {
      subject: `RFP Invitation: ${rfpData.project_title}`,
      html,
      format: 'html'
    };
  }

  /**
   * Generate proposal evaluation sheet
   */
  async generateEvaluationSheet(rfpData) {
    return {
      title: `Proposal Evaluation Sheet: ${rfpData.project_title}`,
      projectId: rfpData.id,
      evaluationCriteria: this.generateEvaluationCriteria(),
      
      scoringTemplate: {
        technicalCompetency: { score: 0, maxScore: 30, notes: '' },
        costCompetitiveness: { score: 0, maxScore: 25, notes: '' },
        timelineFeasibility: { score: 0, maxScore: 20, notes: '' },
        vendorQualifications: { score: 0, maxScore: 15, notes: '' },
        complianceApproach: { score: 0, maxScore: 10, notes: '' },
        totalScore: 0,
        maxTotalScore: 100,
        recommendation: '',
        evaluatorNotes: ''
      },
      
      vendorComparison: {
        columns: ['Vendor', 'Technical', 'Cost', 'Timeline', 'Qualifications', 'Compliance', 'Total', 'Rank'],
        rows: []
      }
    };
  }

  /**
   * Save RFP documents to database
   */
  async saveRFPDocuments(rfpProjectId, documents) {
    const documentRecords = [
      {
        rfp_project_id: rfpProjectId,
        document_type: 'rfp_published',
        document_title: documents.rfpDocument.title,
        document_content: JSON.stringify(documents.rfpDocument),
        is_template: false
      },
      {
        rfp_project_id: rfpProjectId,
        document_type: 'vendor_invitation',
        document_title: documents.invitationTemplate.subject,
        document_content: JSON.stringify(documents.invitationTemplate),
        is_template: true
      }
    ];

    const { error } = await this.supabase
      .from('rfp_documents')
      .insert(documentRecords);

    if (error) throw error;
  }

  /**
   * Generate RFP from compliance issues
   */
  async generateRFPFromCompliance(propertyId, complianceIssues, projectType = 'compliance_fix') {
    try {
      // Get property and compliance data
      const { data: property, error: propError } = await this.supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propError) throw propError;

      const { data: complianceReport, error: compError } = await this.supabase
        .from('compliance_reports')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (compError) throw compError;

      // Generate project title based on compliance issues
      const projectTitle = this.generateProjectTitleFromIssues(complianceIssues, projectType);
      
      // Generate scope of work from compliance issues
      const scopeOfWork = this.generateScopeFromComplianceIssues(complianceIssues, complianceReport.report_data);

      // Create RFP project
      const { data: rfpProject, error: rfpError } = await this.supabase
        .from('rfp_projects')
        .insert({
          user_id: property.user_id,
          property_id: propertyId,
          compliance_report_id: complianceReport.id,
          project_title: projectTitle,
          project_description: `Address compliance issues: ${complianceIssues.join(', ')}`,
          project_type: projectType,
          scope_of_work: scopeOfWork,
          compliance_issues: complianceIssues,
          urgency_level: this.determineUrgencyFromIssues(complianceIssues),
          status: 'draft'
        })
        .select()
        .single();

      if (rfpError) throw rfpError;

      return rfpProject;

    } catch (error) {
      console.error('Error generating RFP from compliance:', error);
      throw error;
    }
  }

  /**
   * Generate project title from compliance issues
   */
  generateProjectTitleFromIssues(issues, projectType) {
    const issueTypes = {
      'violations': 'Violation Remediation',
      'permits': 'Permit Work',
      'inspections': 'Inspection Preparation',
      'equipment': 'Equipment Repair/Replacement',
      'safety': 'Safety Compliance'
    };

    const primaryIssue = issues[0] || 'General Compliance';
    const issueType = Object.keys(issueTypes).find(key => 
      primaryIssue.toLowerCase().includes(key)
    );

    return `${issueTypes[issueType] || 'Compliance Work'} - ${primaryIssue}`;
  }

  /**
   * Generate scope of work from compliance issues
   */
  generateScopeFromComplianceIssues(issues, complianceData) {
    let scope = 'The contractor shall address the following compliance issues:\n\n';
    
    issues.forEach((issue, index) => {
      scope += `${index + 1}. ${issue}\n`;
      
      // Add specific requirements based on issue type
      if (issue.toLowerCase().includes('violation')) {
        scope += '   - Correct all violations to code compliance\n';
        scope += '   - Coordinate with local authorities for re-inspection\n';
        scope += '   - Provide documentation of corrections\n\n';
      } else if (issue.toLowerCase().includes('permit')) {
        scope += '   - Obtain all required permits\n';
        scope += '   - Ensure work meets permit requirements\n';
        scope += '   - Coordinate permit inspections\n\n';
      } else if (issue.toLowerCase().includes('inspection')) {
        scope += '   - Prepare property for inspection\n';
        scope += '   - Coordinate inspection scheduling\n';
        scope += '   - Address any inspection findings\n\n';
      }
    });

    scope += 'All work must be performed in accordance with local building codes and regulations.';
    
    return scope;
  }

  /**
   * Determine urgency level from compliance issues
   */
  determineUrgencyFromIssues(issues) {
    const criticalKeywords = ['violation', 'safety', 'emergency', 'immediate'];
    const highKeywords = ['deadline', 'urgent', 'priority'];
    
    const issueText = issues.join(' ').toLowerCase();
    
    if (criticalKeywords.some(keyword => issueText.includes(keyword))) {
      return 'critical';
    } else if (highKeywords.some(keyword => issueText.includes(keyword))) {
      return 'high';
    } else {
      return 'normal';
    }
  }
}

export default RFPGenerator;
