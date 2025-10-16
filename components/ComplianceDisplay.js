/**
 * City-Aware Compliance Display Components
 * Handles both NYC and Philadelphia compliance data
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Flame, Zap, TrendingUp, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Main compliance display component - routes to city-specific view
 */
export default function ComplianceDisplay({ report, city }) {
  const reportCity = city || report?.city || report?.report_data?.city || 'NYC';

  if (reportCity === 'Philadelphia' || reportCity === 'Philly') {
    return <PhiladelphiaCompliance report={report} />;
  }

  return <NYCCompliance report={report} />;
}

/**
 * Philadelphia L&I Compliance Display
 */
function PhiladelphiaCompliance({ report }) {
  const data = report?.report_data || {};
  const scores = data.scores || {};

  return (
    <div className="space-y-6">
      {/* L&I Permits Section */}
      <ComplianceSection
        icon={<FileText className="w-6 h-6" />}
        title="L&I Building Permits"
        count={scores.li_permits_total || 0}
        activeCount={scores.li_permits_recent || 0}
        description={`${scores.li_permits_recent || 0} recent permits in last 2 years`}
        status={scores.li_permits_total > 0 ? 'good' : 'neutral'}
        data={data.data?.li_permits || []}
        renderItem={(permit) => (
          <PhillyPermitItem permit={permit} key={permit.permitnumber} />
        )}
      />

      {/* L&I Violations Section */}
      <ComplianceSection
        icon={<AlertTriangle className="w-6 h-6" />}
        title="L&I Code Violations"
        count={scores.li_violations_total || 0}
        activeCount={scores.li_violations_active || 0}
        description={`${scores.li_violations_active || 0} active violations`}
        status={scores.li_violations_active === 0 ? 'good' : 'warning'}
        data={data.data?.li_violations || []}
        renderItem={(violation) => (
          <PhillyViolationItem violation={violation} key={violation.violationid} />
        )}
      />

      {/* Building Certifications Section */}
      <ComplianceSection
        icon={<CheckCircle className="w-6 h-6" />}
        title="Building Certifications"
        count={scores.li_certifications_active + scores.li_certifications_expired || 0}
        activeCount={scores.li_certifications_active || 0}
        description={`${scores.li_certifications_expired || 0} expired certifications`}
        status={scores.li_certifications_expired === 0 ? 'good' : 'warning'}
        data={data.data?.li_certifications || []}
        renderItem={(cert) => (
          <PhillyCertificationItem certification={cert} key={cert.id} />
        )}
      />

      {/* L&I Investigations Section */}
      <ComplianceSection
        icon={<Building2 className="w-6 h-6" />}
        title="L&I Case Investigations"
        count={scores.li_investigations_total || 0}
        description="Inspector visits and investigations"
        status="neutral"
        data={data.data?.li_investigations || []}
        renderItem={(investigation) => (
          <PhillyInvestigationItem investigation={investigation} key={investigation.caseid} />
        )}
      />
    </div>
  );
}

/**
 * NYC DOB/HPD Compliance Display
 */
function NYCCompliance({ report }) {
  const data = report?.report_data || {};
  const scores = data.scores || {};

  return (
    <div className="space-y-6">
      {/* HPD Violations Section */}
      <ComplianceSection
        icon={<AlertTriangle className="w-6 h-6" />}
        title="HPD Violations"
        count={scores.hpd_violations_active || 0}
        description="Housing Preservation & Development violations"
        status={scores.hpd_violations_active === 0 ? 'good' : 'warning'}
        data={data.data?.hpd_violations || []}
        renderItem={(violation) => (
          <NYCViolationItem violation={violation} type="HPD" key={violation.violationid} />
        )}
      />

      {/* DOB Violations Section */}
      <ComplianceSection
        icon={<AlertTriangle className="w-6 h-6" />}
        title="DOB Violations"
        count={scores.dob_violations_active || 0}
        description="Department of Buildings violations"
        status={scores.dob_violations_active === 0 ? 'good' : 'warning'}
        data={data.data?.dob_violations || []}
        renderItem={(violation) => (
          <NYCViolationItem violation={violation} type="DOB" key={violation.isn_dob_bis_extract} />
        )}
      />

      {/* Elevator Equipment Section */}
      <ComplianceSection
        icon={<TrendingUp className="w-6 h-6" />}
        title="Elevator Equipment"
        count={scores.elevator_devices || 0}
        description="Elevator inspection records"
        status="neutral"
        data={data.data?.elevator_data || []}
        renderItem={(device) => (
          <NYCEquipmentItem equipment={device} type="Elevator" key={device.device_number} />
        )}
      />

      {/* Boiler Equipment Section */}
      <ComplianceSection
        icon={<Flame className="w-6 h-6" />}
        title="Boiler Equipment"
        count={scores.boiler_devices || 0}
        description="Boiler inspection records"
        status="neutral"
        data={data.data?.boiler_data || []}
        renderItem={(device) => (
          <NYCEquipmentItem equipment={device} type="Boiler" key={device.device_number} />
        )}
      />

      {/* Electrical Permits Section */}
      <ComplianceSection
        icon={<Zap className="w-6 h-6" />}
        title="Electrical Permits"
        count={scores.electrical_permits || 0}
        description="Electrical work permits and inspections"
        status="neutral"
        data={data.data?.electrical_permits || []}
        renderItem={(permit) => (
          <NYCPermitItem permit={permit} type="Electrical" key={permit.job_number} />
        )}
      />
    </div>
  );
}

/**
 * Generic compliance section wrapper
 */
function ComplianceSection({ icon, title, count, activeCount, description, status, data, renderItem }) {
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const statusColor = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    neutral: 'text-slate-400'
  }[status] || 'text-slate-400';

  const hasItems = data && data.length > 0;

  // Sort data by date (most recent first) if it's violations data
  const sortedData = hasItems && title.includes('Violations') 
    ? [...data].sort((a, b) => {
        // Try various date field names used in NYC violations
        const dateA = new Date(a.novissueddate || a.inspectiondate || a.issue_date || a.issuedate || a.violation_date || a.certify_date || 0);
        const dateB = new Date(b.novissueddate || b.inspectiondate || b.issue_date || b.issuedate || b.violation_date || b.certify_date || 0);
        return dateB - dateA; // Newest first
      })
    : data;

  return (
    <div className="card">
      <div
        className="flex items-center justify-between p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-4">
          <div className={cn("p-3 rounded-lg bg-slate-800/50", statusColor)}>
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">
              {count} total{activeCount !== undefined && `, ${activeCount} active`}
            </p>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {hasItems && (
            <span className="badge badge-primary">{sortedData.length} records</span>
          )}
        </div>
      </div>

      {expanded && hasItems && (
        <div className="border-t border-slate-700 p-6 space-y-3">
          {sortedData.slice(0, visibleCount).map(renderItem)}

          {data.length > visibleCount && (
            <button
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="btn-secondary w-full mt-4"
            >
              Show More ({data.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}

      {expanded && !hasItems && (
        <div className="border-t border-slate-700 p-6 text-center text-slate-500">
          No {title.toLowerCase()} found
        </div>
      )}
    </div>
  );
}

/**
 * Individual item renderers for Philadelphia data
 */
function PhillyPermitItem({ permit }) {
  return (
    <div className="p-4 bg-slate-800/30 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-white">{permit.permittype || 'Permit'}</h4>
          <p className="text-sm text-slate-400 mt-1">{permit.permitdescription}</p>
        </div>
        <span className="badge badge-primary">{permit.permitnumber}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Issued: {permit.permitissuedate ? new Date(permit.permitissuedate).toLocaleDateString() : 'N/A'}
        {permit.contractor && ` • Contractor: ${permit.contractor}`}
      </div>
    </div>
  );
}

function PhillyViolationItem({ violation }) {
  const isActive = violation.status?.toUpperCase() === 'OPEN' || violation.status?.toUpperCase() === 'ACTIVE';

  return (
    <div className={cn("p-4 rounded-lg", isActive ? "bg-red-500/10 border border-red-500/20" : "bg-slate-800/30")}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-white">{violation.violationtype}</h4>
          <p className="text-sm text-slate-400 mt-1">{violation.violationdescription}</p>
        </div>
        <span className={cn("badge", isActive ? "badge-error" : "badge-primary")}>
          {violation.status || 'Unknown'}
        </span>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Date: {violation.violationdate ? new Date(violation.violationdate).toLocaleDateString() : 'N/A'}
        {violation.inspector && ` • Inspector: ${violation.inspector}`}
      </div>
    </div>
  );
}

function PhillyCertificationItem({ certification }) {
  const isActive = certification.status?.toUpperCase() === 'ACTIVE' || certification.status?.toUpperCase() === 'CURRENT';

  return (
    <div className={cn("p-4 rounded-lg", isActive ? "bg-green-500/10 border border-green-500/20" : "bg-slate-800/30")}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-white">{certification.cert_type || 'Certification'}</h4>
          <p className="text-sm text-slate-400 mt-1">{certification.description}</p>
        </div>
        <span className={cn("badge", isActive ? "badge-success" : "badge-error")}>
          {certification.status || 'Unknown'}
        </span>
      </div>
      {certification.expiration_date && (
        <div className="mt-2 text-xs text-slate-500">
          Expires: {new Date(certification.expiration_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function PhillyInvestigationItem({ investigation }) {
  return (
    <div className="p-4 bg-slate-800/30 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-white">{investigation.investigationtype || 'Investigation'}</h4>
          <p className="text-sm text-slate-400 mt-1">Case: {investigation.caseid}</p>
        </div>
        <span className="badge badge-primary">{investigation.outcome || 'Completed'}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Date: {investigation.investigationcompleted ? new Date(investigation.investigationcompleted).toLocaleDateString() : 'N/A'}
        {investigation.inspector && ` • Inspector: ${investigation.inspector}`}
      </div>
    </div>
  );
}

/**
 * Individual item renderers for NYC data
 */
function NYCViolationItem({ violation, type }) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-white">{violation.violationdescription || violation.violation_type}</h4>
          <p className="text-sm text-slate-400 mt-1">{violation.class || ''}</p>
        </div>
        <span className="badge badge-error">{type}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Date: {violation.novissueddate || violation.issue_date}
      </div>
    </div>
  );
}

function NYCEquipmentItem({ equipment, type }) {
  return (
    <div className="p-4 bg-slate-800/30 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-white">{type} #{equipment.device_number}</h4>
          <p className="text-sm text-slate-400 mt-1">{equipment.device_status || equipment.status_description}</p>
        </div>
        <span className="badge badge-primary">{equipment.device_number}</span>
      </div>
      {equipment.lastperiodicinspectiondate && (
        <div className="mt-2 text-xs text-slate-500">
          Last Inspection: {new Date(equipment.lastperiodicinspectiondate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function NYCPermitItem({ permit, type }) {
  return (
    <div className="p-4 bg-slate-800/30 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-white">{type} Permit</h4>
          <p className="text-sm text-slate-400 mt-1">Job #{permit.job_number}</p>
        </div>
        <span className="badge badge-primary">{permit.job_type}</span>
      </div>
      {permit.filing_date && (
        <div className="mt-2 text-xs text-slate-500">
          Filed: {new Date(permit.filing_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
