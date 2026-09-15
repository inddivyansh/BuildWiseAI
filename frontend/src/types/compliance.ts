/**
 * Compliance and Violation Types — Frontend TypeScript Contracts
 */

export type ResultStatus =
  | 'PASS'
  | 'FAIL'
  | 'WARNING'
  | 'INSUFFICIENT_DATA'
  | 'UNVERIFIED'
  | 'NOT_APPLICABLE'

export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'ADVISORY'

export type RuleVerificationStatus = 'DRAFT' | 'REQUIRES_VERIFICATION' | 'VERIFIED' | 'DEPRECATED'

export interface Violation {
  id: string
  compliance_result_id: string
  rule_id: string
  title: string
  severity: Severity
  status: ResultStatus
  entity_type: 'room' | 'wall' | 'opening' | 'corridor' | 'stair' | 'floor'
  entity_id?: string
  geometry_hint: 'polygon' | 'line' | 'point' | 'polyline' | 'bbox'
  coordinates: number[][] | number[][][]
  label_text?: string
  label_position?: { x: number; y: number }
  floor_level: number
  measured_value?: number
  required_value?: number
  unit?: string
  regulation_source?: string
  recommendation?: string
  llm_explanation?: string
}

export interface ComplianceResult {
  id: string
  rule_id: string
  title: string
  description?: string
  status: ResultStatus
  severity: Severity
  measured_value?: number
  required_value?: number
  unit?: string
  regulation_source?: string
  confidence: string
  recommendation?: string
  llm_explanation?: string
  evidence?: Record<string, any>
  floor_level?: number
}

export interface ComplianceSummary {
  total_checks: number
  passed: number
  failed: number
  unverified: number
  warning: number
  insufficient_data: number
  not_applicable: number
  compliance_score_pct: number
}

export interface ComplianceRuleMeta {
  rule_id: string
  title: string
  description: string
  category: string
  severity: Severity
  regulation_source: string
  part?: string
  clause?: string
  parameter?: string
  unit?: string
  verification_status: RuleVerificationStatus
  rule_version: string
}
