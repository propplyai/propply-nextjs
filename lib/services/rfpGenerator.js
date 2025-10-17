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
      
      // Generate proposal evaluation sheet
      const evaluationSheet = await this.generateEvaluationSheet(rfpData);

      // Save all documents to database
      await this.saveRFPDocuments(rfpProjectId, {
        rfpDocument,
        invitationTemplate,
        evaluationSheet
      });

      return {
        success: true,
        documents: {
          rfp: rfpDocument,
          invitation: invitationTemplate,
          evaluation: evaluationSheet
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
   * Generate the main RFP document
   */
  async generateMainRFPDocument(rfpData) {
    const { properties, compliance_reports } = rfpData;
    const complianceData = compliance_reports?.report_data || {};
    
    const document = {
      title: `Request for Proposal: ${rfpData.project_title}`,
      projectId: rfpData.id,
      generatedAt: new Date().toISOString(),
      
      // Executive Summary
      executiveSummary: this.generateExecutiveSummary(rfpData, properties, complianceData),
      
      // Project Information
      projectInformation: {
        title: rfpData.project_title,
        description: rfpData.project_description,
        type: rfpData.project_type,
        property: {
          address: properties.address,
          city: properties.city,
          state: properties.state,
          zipCode: properties.zip_code,
          propertyType: properties.property_type
        },
        timeline: {
          projectDays: rfpData.project_timeline_days,
          deadline: rfpData.deadline_date,
          urgency: rfpData.urgency_level
        },
        budget: {
          min: rfpData.budget_range_min,
          max: rfpData.budget_range_max
        }
      },

      // Scope of Work
      scopeOfWork: {
        description: rfpData.scope_of_work,
        technicalRequirements: rfpData.technical_requirements,
        materialsSpecifications: rfpData.materials_specifications,
        qualityStandards: rfpData.quality_standards
      },

      // Compliance Context
      complianceContext: this.generateComplianceContext(rfpData, complianceData),

      // Regulatory Requirements
      regulatoryRequirements: {
        complianceIssues: rfpData.compliance_issues,
        regulatoryRequirements: rfpData.regulatory_requirements,
        permitRequirements: rfpData.permit_requirements,
        inspectionRequirements: rfpData.inspection_requirements
      },

      // Proposal Requirements
      proposalRequirements: this.generateProposalRequirements(),

      // Evaluation Criteria
      evaluationCriteria: this.generateEvaluationCriteria(),

      // Terms and Conditions
      termsAndConditions: this.generateTermsAndConditions()
    };

    return document;
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
   * Generate vendor invitation template
   */
  async generateVendorInvitation(rfpData) {
    return {
      subject: `RFP Invitation: ${rfpData.project_title}`,
      template: `
Dear Vendor,

You are invited to submit a proposal for the following project:

**Project:** ${rfpData.project_title}
**Property:** ${rfpData.properties.address}
**Project Type:** ${rfpData.project_type}
**Timeline:** ${rfpData.project_timeline_days} days
**Budget Range:** $${rfpData.budget_range_min?.toLocaleString()} - $${rfpData.budget_range_max?.toLocaleString()}

**Compliance Context:**
This project addresses compliance issues at a property with a compliance score of ${rfpData.properties.compliance_score}% and ${rfpData.properties.active_violations} active violations.

**Next Steps:**
1. Review the attached RFP document
2. Submit your proposal by [DEADLINE]
3. Include all required documentation
4. Contact us with any questions

We look forward to your proposal.

Best regards,
Property Management Team
      `.trim()
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
      },
      {
        rfp_project_id: rfpProjectId,
        document_type: 'evaluation_sheet',
        document_title: documents.evaluationSheet.title,
        document_content: JSON.stringify(documents.evaluationSheet),
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
