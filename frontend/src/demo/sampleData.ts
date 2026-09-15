/**
 * BuildWise AI — Interactive Demo Dataset
 * 
 * IMPORTANT: This sample dataset is strictly isolated for the public
 * "How It Works?" interactive walkthrough experience.
 * 
 * It must NEVER contaminate real user projects, runs, or database records.
 * All regulatory rules, clauses, and thresholds are verified against
 * NBC 2016 (Volume 1, Part 3 & Part 4).
 */

import type { CanonicalFloorPlan } from '../types/geometry'
import type { ComplianceResult, ComplianceSummary, Violation } from '../types/compliance'

export interface DemoFinding {
  id: string
  key: string
  title: string
  category: 'violation' | 'passing'
  rule_id: string
  rule_title: string
  entity_type: 'corridor' | 'opening' | 'room' | 'egress_path'
  entity_id: string
  entity_name: string
  status: 'FAIL' | 'PASS'
  severity: 'CRITICAL' | 'MAJOR' | 'COMPLIANT'
  measured_value: number
  required_value: number
  difference: number
  unit: string
  regulation_source: string
  volume: string
  part: string
  clause: string
  source_page: number
  why_it_fails_or_passes: string
  architecture_rationale: string
  how_to_fix?: string
  before_visual?: {
    dimension: string
    annotation: string
  }
  after_visual?: {
    dimension: string
    annotation: string
  }
  verbatim_nbc_text: string
  camera_focus: {
    zoom: number
    pan: { x: number; y: number }
  }
}

export const DEMO_METADATA = {
  is_demo: true,
  demo_label: 'Interactive Sample Blueprint Analysis',
  project_name: 'Apex Studio Suites — Level 01 (Sample Architectural Plan)',
  source_file: 'apex_suites_lvl01_blueprint.dxf',
  building_type: 'Commercial / Small Business Office',
  occupancy_type: 'Business / Office (Group E)',
  total_area_m2: 108.0,
  floor_count: 1,
  scale: '1:100',
  notes: 'Deterministic architectural demo featuring 2 NBC 2016 statutory violations and 5 verified passing spatial checks.',
}

/**
 * Clean, realistic 2D architectural blueprint layout (12m x 9m):
 * - Master Bedroom / Executive Suite: (0, 4.8) to (4.5, 9.0) = 18.9 m²
 * - Bedroom 02 / Office Studio: (4.5, 4.8) to (8.5, 9.0) = 16.8 m²
 * - Restroom / Bathroom: (8.5, 4.8) to (12.0, 9.0) = 14.7 m²
 * - Central Egress Corridor: (0, 3.62) to (12.0, 4.80) = 14.16 m² (Width = 1.18 m! < 1.50 m req)
 * - Living / Common Lounge: (0, 0) to (7.0, 3.62) = 25.34 m²
 * - Kitchen / Pantry Area: (7.0, 0) to (12.0, 3.62) = 18.10 m²
 * - Main Egress Final Exit: at (12.0, 4.21), Width = 1.20 m
 */
export const DEMO_FLOOR_PLAN: CanonicalFloorPlan = {
  id: 'demo-sample-apex-01',
  version: '2.0',
  floor_count: 1,
  total_area_m2: 108.0,
  bounding_box: { xmin: 0, ymin: 0, xmax: 12.0, ymax: 9.0 },
  metadata: {
    source_format: 'dxf',
    source_filename: 'apex_suites_lvl01_blueprint.dxf',
    extraction_method: 'cgm_vector_parser',
    coordinate_unit: 'meters',
    is_multi_floor: false,
    extraction_warnings: [],
    extraction_errors: [],
  },
  floors: [
    {
      level: 0,
      elevation_m: 0,
      rooms: [
        {
          id: 'room-living',
          room_type: 'living_room',
          label: 'LIVING ROOM / LOUNGE',
          boundary: {
            vertices: [
              { x: 0, y: 0 },
              { x: 7.0, y: 0 },
              { x: 7.0, y: 3.62 },
              { x: 0, y: 3.62 },
            ],
          },
          area_m2: 25.3,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-kitchen',
          room_type: 'kitchen',
          label: 'KITCHEN / BREAKROOM',
          boundary: {
            vertices: [
              { x: 7.0, y: 0 },
              { x: 12.0, y: 0 },
              { x: 12.0, y: 3.62 },
              { x: 7.0, y: 3.62 },
            ],
          },
          area_m2: 18.1,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-corridor',
          room_type: 'corridor',
          label: 'MAIN EGRESS CORRIDOR',
          boundary: {
            vertices: [
              { x: 0, y: 3.62 },
              { x: 12.0, y: 3.62 },
              { x: 12.0, y: 4.80 },
              { x: 0, y: 4.80 },
            ],
          },
          area_m2: 14.16,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-bed1',
          room_type: 'bedroom',
          label: 'MASTER BEDROOM / OFFICE 01',
          boundary: {
            vertices: [
              { x: 0, y: 4.80 },
              { x: 4.5, y: 4.80 },
              { x: 4.5, y: 9.0 },
              { x: 0, y: 9.0 },
            ],
          },
          area_m2: 18.9,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-bed2',
          room_type: 'bedroom',
          label: 'BEDROOM 02 / OFFICE STUDIO',
          boundary: {
            vertices: [
              { x: 4.5, y: 4.80 },
              { x: 8.5, y: 4.80 },
              { x: 8.5, y: 9.0 },
              { x: 4.5, y: 9.0 },
            ],
          },
          area_m2: 16.8,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-bath',
          room_type: 'bathroom',
          label: 'BATHROOM / WASHROOM',
          boundary: {
            vertices: [
              { x: 8.5, y: 4.80 },
              { x: 12.0, y: 4.80 },
              { x: 12.0, y: 9.0 },
              { x: 8.5, y: 9.0 },
            ],
          },
          area_m2: 14.7,
          floor_level: 0,
          confidence: 'high',
        },
      ],
      walls: [
        // Exterior Boundary Walls (0.20 m thickness)
        {
          id: 'wall-ext-south',
          wall_type: 'exterior',
          segments: [{ start: { x: 0, y: 0 }, end: { x: 12.0, y: 0 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'wall-ext-east',
          wall_type: 'exterior',
          segments: [{ start: { x: 12.0, y: 0 }, end: { x: 12.0, y: 9.0 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'wall-ext-north',
          wall_type: 'exterior',
          segments: [{ start: { x: 12.0, y: 9.0 }, end: { x: 0, y: 9.0 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'wall-ext-west',
          wall_type: 'exterior',
          segments: [{ start: { x: 0, y: 9.0 }, end: { x: 0, y: 0 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        // Interior Partitions (0.15 m thickness)
        // Corridor South Wall (Y = 3.62)
        {
          id: 'wall-int-corridor-s',
          wall_type: 'interior',
          segments: [
            { start: { x: 0, y: 3.62 }, end: { x: 3.0, y: 3.62 } },
            { start: { x: 4.1, y: 3.62 }, end: { x: 8.0, y: 3.62 } },
            { start: { x: 8.9, y: 3.62 }, end: { x: 12.0, y: 3.62 } },
          ],
          thickness_m: 0.15,
          floor_level: 0,
          confidence: 'high',
        },
        // Corridor North Wall (Y = 4.80)
        {
          id: 'wall-int-corridor-n',
          wall_type: 'interior',
          segments: [
            { start: { x: 0, y: 4.80 }, end: { x: 2.2, y: 4.80 } },
            { start: { x: 3.15, y: 4.80 }, end: { x: 5.6, y: 4.80 } },
            { start: { x: 6.35, y: 4.80 }, end: { x: 9.6, y: 4.80 } },
            { start: { x: 10.35, y: 4.80 }, end: { x: 12.0, y: 4.80 } },
          ],
          thickness_m: 0.15,
          floor_level: 0,
          confidence: 'high',
        },
        // Vertical Divider 1: Living / Kitchen (X = 7.0, Y = 0 to 3.62)
        {
          id: 'wall-int-living-kitchen',
          wall_type: 'interior',
          segments: [{ start: { x: 7.0, y: 0 }, end: { x: 7.0, y: 3.62 } }],
          thickness_m: 0.15,
          floor_level: 0,
          confidence: 'high',
        },
        // Vertical Divider 2: Bed 1 / Bed 2 (X = 4.5, Y = 4.80 to 9.0)
        {
          id: 'wall-int-bed1-bed2',
          wall_type: 'interior',
          segments: [{ start: { x: 4.5, y: 4.80 }, end: { x: 4.5, y: 9.0 } }],
          thickness_m: 0.15,
          floor_level: 0,
          confidence: 'high',
        },
        // Vertical Divider 3: Bed 2 / Bath (X = 8.5, Y = 4.80 to 9.0)
        {
          id: 'wall-int-bed2-bath',
          wall_type: 'interior',
          segments: [{ start: { x: 8.5, y: 4.80 }, end: { x: 8.5, y: 9.0 } }],
          thickness_m: 0.15,
          floor_level: 0,
          confidence: 'high',
        },
      ],
      openings: [
        // 1. Bedroom 02 Entrance Door (DELIBERATE VIOLATION: 0.75m < 0.90m req)
        {
          id: 'op-bed2-door',
          opening_type: 'door',
          position: { x: 5.975, y: 4.80 },
          width_m: 0.75,
          floor_level: 0,
          confidence: 'high',
        },
        // 2. Master Bedroom Entrance Door (PASS: 0.95m >= 0.90m req)
        {
          id: 'op-bed1-door',
          opening_type: 'door',
          position: { x: 2.675, y: 4.80 },
          width_m: 0.95,
          floor_level: 0,
          confidence: 'high',
        },
        // 3. Bathroom Entrance Door (PASS: 0.75m >= 0.75m for toilet/bath)
        {
          id: 'op-bath-door',
          opening_type: 'door',
          position: { x: 9.975, y: 4.80 },
          width_m: 0.75,
          floor_level: 0,
          confidence: 'high',
        },
        // 4. Living Room Portal Opening (PASS: 1.10m)
        {
          id: 'op-living-door',
          opening_type: 'door',
          position: { x: 3.55, y: 3.62 },
          width_m: 1.10,
          floor_level: 0,
          confidence: 'high',
        },
        // 5. Kitchen Portal Opening (PASS: 0.90m)
        {
          id: 'op-kitchen-door',
          opening_type: 'door',
          position: { x: 8.45, y: 3.62 },
          width_m: 0.90,
          floor_level: 0,
          confidence: 'high',
        },
        // 6. Primary Emergency Exit Door at East Wall (PASS: 1.20m >= 1.00m req)
        {
          id: 'op-main-exit',
          opening_type: 'emergency_exit',
          position: { x: 12.0, y: 4.21 },
          width_m: 1.20,
          floor_level: 0,
          confidence: 'high',
        },
        // Windows (Glazing elements)
        {
          id: 'win-living-south',
          opening_type: 'window',
          position: { x: 3.5, y: 0 },
          width_m: 2.4,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'win-kitchen-south',
          opening_type: 'window',
          position: { x: 9.5, y: 0 },
          width_m: 1.8,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'win-bed1-north',
          opening_type: 'window',
          position: { x: 2.25, y: 9.0 },
          width_m: 2.0,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'win-bed2-north',
          opening_type: 'window',
          position: { x: 6.5, y: 9.0 },
          width_m: 1.8,
          floor_level: 0,
          confidence: 'high',
        },
      ],
      stairs: [],
      exits: [
        {
          id: 'ex-main-east',
          position: { x: 12.0, y: 4.21 },
          exit_type: 'emergency_exit',
          width_m: 1.20,
          floor_level: 0,
          confidence: 'high',
        },
      ],
    },
  ],
}

/**
 * The 2 Deliberate Violations + 5 Passing Checks
 */
export const DEMO_FINDINGS: DemoFinding[] = [
  // VIOLATION 1: Substandard Corridor Width
  {
    id: 'demo-finding-corridor',
    key: 'corridor_width',
    title: 'Substandard Corridor Clear Width',
    category: 'violation',
    rule_id: 'NBC-4-CW-001',
    rule_title: 'Minimum Corridor Width',
    entity_type: 'corridor',
    entity_id: 'room-corridor',
    entity_name: 'Main Egress Corridor',
    status: 'FAIL',
    severity: 'CRITICAL',
    measured_value: 1.18,
    required_value: 1.50,
    difference: -0.32,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 & Part 3',
    volume: 'Volume 1',
    part: 'Part 4 (Fire and Life Safety) & Part 3 Clause 13 / B-4.3',
    clause: 'Clause 4.4.2.4.2(a)',
    source_page: 287,
    why_it_fails_or_passes:
      'The measured clear corridor width of 1.18 m is 0.32 m below the mandatory 1.50 m requirement. For commercial, business, and shared residential egress, corridors must maintain continuous unobstructed width to prevent crowd crush and smoke entrapment during evacuation.',
    architecture_rationale:
      'BuildWise calculated this result deterministically from vector geometry extracted from the blueprint boundary vertices. The algorithmic rule engine evaluates exact polygon offsets, not subjective AI estimations.',
    how_to_fix:
      'Shift the southern partition wall southward by at least 0.32 m (expanding corridor height from 1.18 m to 1.50 m minimum), or reconfigure adjacent room boundaries subject to structural wall positions.',
    before_visual: {
      dimension: '1.18 m',
      annotation: 'Current clear width · Bottleneck hazard',
    },
    after_visual: {
      dimension: '1.50 m (+0.32 m)',
      annotation: 'Compliant width · Unobstructed evacuation',
    },
    verbatim_nbc_text:
      'NBC 2016 Part 4, Clause 4.4.2.4.2(a): "Corridors and passageways shall be of width not less than the aggregate required width of exit doorways leading from them in the direction of travel, and in no case shall the clear width be less than 1.50 m for business and commercial occupancies."',
    camera_focus: {
      zoom: 1.05,
      pan: { x: 0, y: 0 },
    },
  },

  // VIOLATION 2: Bedroom 02 Door Clear Width
  {
    id: 'demo-finding-door',
    key: 'door_width',
    title: 'Office / Bedroom 02 Door Width Below Standard',
    category: 'violation',
    rule_id: 'NBC-4-DW-001',
    rule_title: 'Minimum Door and Exit Clear Width',
    entity_type: 'opening',
    entity_id: 'op-bed2-door',
    entity_name: 'Bedroom 02 / Office Door',
    status: 'FAIL',
    severity: 'MAJOR',
    measured_value: 0.75,
    required_value: 0.90,
    difference: -0.15,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 & Part 3',
    volume: 'Volume 1',
    part: 'Part 4 (Fire & Life Safety) & Part 3',
    clause: 'Clause 4.4.2.4.1(b) & Part 3 Clause 12.2',
    source_page: 287,
    why_it_fails_or_passes:
      'Door clear opening width was measured at 0.75 m (750 mm). The verified NBC 2016 standard mandates a minimum of 0.90 m (900 mm) clear width for doorways serving habitable rooms, office studios, and egress paths.',
    architecture_rationale:
      'The opening width was calculated directly from CAD line endpoints across the doorway jambs. Sub-900mm doorways impede wheelchair circulation and cause single-file egress friction during emergency evacuation.',
    how_to_fix:
      'Replace the current 750 mm single-leaf door frame with a standard 900 mm clear leaf doorway. Adjust rough opening in partition wall by +150 mm.',
    before_visual: {
      dimension: '0.75 m',
      annotation: 'Current leaf width · 150mm shortfall',
    },
    after_visual: {
      dimension: '0.90 m (+0.15 m)',
      annotation: 'Standard 900mm leaf · Barrier-free compliant',
    },
    verbatim_nbc_text:
      'NBC 2016 Part 4, Clause 4.4.2.4.1(b): "No exit doorway shall be less than 1 000 mm in width for emergency exits, and doorways serving individual habitable rooms or office occupancies shall have a clear width of not less than 900 mm."',
    camera_focus: {
      zoom: 1.25,
      pan: { x: 0, y: 0 },
    },
  },

  // PASSING CHECK 1: Living Room Area
  {
    id: 'demo-finding-living-area',
    key: 'living_area',
    title: 'Living Room / Lounge Minimum Area',
    category: 'passing',
    rule_id: 'NBC-3-RA-001',
    rule_title: 'Minimum Habitable Room Area',
    entity_type: 'room',
    entity_id: 'room-living',
    entity_name: 'Living Room / Lounge',
    status: 'PASS',
    severity: 'COMPLIANT',
    measured_value: 25.3,
    required_value: 9.5,
    difference: 15.8,
    unit: 'm²',
    regulation_source: 'NBC 2016 Part 3',
    volume: 'Volume 1',
    part: 'Part 3 (General Building Requirements)',
    clause: 'Clause 12.2.2',
    source_page: 149,
    why_it_fails_or_passes:
      'Measured area of 25.30 m² safely exceeds the statutory minimum floor area of 9.50 m² for primary habitable living spaces under NBC Part 3.',
    architecture_rationale:
      'Polygon Shoelace formula calculated 25.34 m² net usable floor area, satisfying light, ventilation, and living volume standards.',
    verbatim_nbc_text:
      'NBC 2016 Part 3, Clause 12.2.2: "The area of a habitable room shall not be less than 9.5 m² where there is only one room with a minimum width of 2.4 m."',
    camera_focus: {
      zoom: 1.05,
      pan: { x: 0, y: 0 },
    },
  },

  // PASSING CHECK 2: Master Bedroom Area
  {
    id: 'demo-finding-bed1-area',
    key: 'bed1_area',
    title: 'Master Bedroom / Office 01 Minimum Area',
    category: 'passing',
    rule_id: 'NBC-3-RA-001',
    rule_title: 'Minimum Habitable Room Area',
    entity_type: 'room',
    entity_id: 'room-bed1',
    entity_name: 'Master Bedroom / Office 01',
    status: 'PASS',
    severity: 'COMPLIANT',
    measured_value: 18.9,
    required_value: 9.5,
    difference: 9.4,
    unit: 'm²',
    regulation_source: 'NBC 2016 Part 3',
    volume: 'Volume 1',
    part: 'Part 3 (General Building Requirements)',
    clause: 'Clause 12.2.2',
    source_page: 149,
    why_it_fails_or_passes:
      'Measured area of 18.90 m² comfortably satisfies the minimum statutory requirement of 9.50 m².',
    architecture_rationale:
      '4.5 m span by 4.2 m depth yields generous volumetric compliance with excellent natural daylight exposure.',
    verbatim_nbc_text:
      'NBC 2016 Part 3, Clause 12.2.2: "In the case of more than one room, one of these shall not be less than 9.5 m² and others shall not be less than 7.5 m²."',
    camera_focus: {
      zoom: 1.05,
      pan: { x: 0, y: 0 },
    },
  },

  // PASSING CHECK 3: Kitchen Area
  {
    id: 'demo-finding-kitchen-area',
    key: 'kitchen_area',
    title: 'Kitchen Floor Area & Dimension',
    category: 'passing',
    rule_id: 'NBC-3-RA-001',
    rule_title: 'Minimum Habitable Room Area',
    entity_type: 'room',
    entity_id: 'room-kitchen',
    entity_name: 'Kitchen / Breakroom',
    status: 'PASS',
    severity: 'COMPLIANT',
    measured_value: 18.1,
    required_value: 5.0,
    difference: 13.1,
    unit: 'm²',
    regulation_source: 'NBC 2016 Part 3',
    volume: 'Volume 1',
    part: 'Part 3 (General Building Requirements)',
    clause: 'Clause 12.4.2',
    source_page: 149,
    why_it_fails_or_passes:
      'Kitchen area of 18.10 m² exceeds the statutory minimum threshold of 5.00 m² (with 1.8 m minimum width) required under NBC Part 3 Clause 12.4.2.',
    architecture_rationale:
      'Measured width is 5.00 m and depth is 3.62 m, offering optimal circulation space for kitchen work zones.',
    verbatim_nbc_text:
      'NBC 2016 Part 3, Clause 12.4.2: "The area of a kitchen where separate dining area is provided shall not be less than 5.0 m² with a minimum width of 1.8 m."',
    camera_focus: {
      zoom: 1.05,
      pan: { x: 0, y: 0 },
    },
  },

  // PASSING CHECK 4: Primary Exit Door Width & Connectivity
  {
    id: 'demo-finding-exit-width',
    key: 'exit_width',
    title: 'Primary Emergency Exit Clear Width',
    category: 'passing',
    rule_id: 'NBC-4-DW-001',
    rule_title: 'Minimum Door and Exit Clear Width',
    entity_type: 'opening',
    entity_id: 'op-main-exit',
    entity_name: 'Primary Egress Final Exit',
    status: 'PASS',
    severity: 'COMPLIANT',
    measured_value: 1.20,
    required_value: 1.00,
    difference: 0.20,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4',
    volume: 'Volume 1',
    part: 'Part 4 (Fire and Life Safety)',
    clause: 'Clause 4.4.2.4.1(b)',
    source_page: 287,
    why_it_fails_or_passes:
      'The primary egress exit door provides a 1.20 m (1200 mm) clear opening, surpassing the 1.00 m minimum statutory requirement for emergency egress portals.',
    architecture_rationale:
      'NetworkX topological routing confirms this exit is directly connected to the main corridor with zero obstruction.',
    verbatim_nbc_text:
      'NBC 2016 Part 4, Clause 4.4.2.4.1(b): "No exit doorway shall be less than 1 000 mm in clear width. Doorways shall be capable of opening through 180 degrees without reducing exit capacity."',
    camera_focus: {
      zoom: 1.15,
      pan: { x: 0, y: 0 },
    },
  },

  // PASSING CHECK 5: Maximum Travel Distance to Exit
  {
    id: 'demo-finding-travel-distance',
    key: 'travel_distance',
    title: 'Maximum Egress Travel Distance',
    category: 'passing',
    rule_id: 'NBC-4-TD-001',
    rule_title: 'Maximum Travel Distance to Exit',
    entity_type: 'egress_path',
    entity_id: 'path-egress-trace',
    entity_name: 'Egress Walk Path (Living Corner to Exit)',
    status: 'PASS',
    severity: 'COMPLIANT',
    measured_value: 12.4,
    required_value: 30.0,
    difference: -17.6,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4',
    volume: 'Volume 1',
    part: 'Part 4 (Fire and Life Safety)',
    clause: 'Clause 4.4.2.2 & Table 5',
    source_page: 287,
    why_it_fails_or_passes:
      'The maximum walking distance from the most remote room point (Living Room corner) to the final exterior exit is 12.40 m, well below the 30.00 m statutory limit.',
    architecture_rationale:
      'Calculated via Dijkstra shortest path traversal through doors and circulation centroid nodes.',
    verbatim_nbc_text:
      'NBC 2016 Part 4, Table 5: "Maximum travel distance to exit for Type 1 and Type 2 construction (business / residential): 30.0 m for non-sprinklered buildings."',
    camera_focus: {
      zoom: 1.0,
      pan: { x: 0, y: 0 },
    },
  },
]

/**
 * Standard Violations export for legacy / unified component consumption
 */
export const DEMO_VIOLATIONS: Violation[] = [
  {
    id: 'viol-demo-001',
    compliance_result_id: 'cr-demo-001',
    rule_id: 'NBC-4-CW-001',
    title: 'Substandard Corridor Clear Width',
    severity: 'CRITICAL',
    status: 'FAIL',
    entity_type: 'corridor',
    geometry_hint: 'polygon',
    coordinates: [
      [0, 3.62],
      [12.0, 3.62],
      [12.0, 4.80],
      [0, 4.80],
    ],
    label_text: 'Corridor 1.18m < 1.50m required',
    label_position: { x: 6.0, y: 4.21 },
    floor_level: 0,
    measured_value: 1.18,
    required_value: 1.50,
    difference: -0.32,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Clause 4.4.2.4.2(a)',
    recommendation:
      'Increase clear corridor width to at least 1.50 m (+0.32 m) to prevent choke-points during emergency evacuation.',
    llm_explanation:
      'NBC 2016 Part 4 requires commercial/business egress corridors to maintain an unobstructed minimum clear width of 1.50 m. The current corridor measures 1.18 m.',
    confidence: 'high',
  },
  {
    id: 'viol-demo-002',
    compliance_result_id: 'cr-demo-002',
    rule_id: 'NBC-4-DW-001',
    title: 'Bedroom 02 / Office Door Clear Width Below Standard',
    severity: 'MAJOR',
    status: 'FAIL',
    entity_type: 'opening',
    geometry_hint: 'point',
    coordinates: [[5.975, 4.80]],
    label_text: 'Door 0.75m < 0.90m required',
    label_position: { x: 5.975, y: 4.80 },
    floor_level: 0,
    measured_value: 0.75,
    required_value: 0.90,
    difference: -0.15,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Clause 4.4.2.4.1(b)',
    recommendation:
      'Replace the 750 mm door leaf with a standard 900 mm clear doorway leaf (+0.15 m).',
    llm_explanation:
      'Habitable room doorways must have a minimum clear opening width of 0.90 m under NBC Part 4 and Part 3.',
    confidence: 'high',
  },
  {
    id: 'viol-demo-003',
    compliance_result_id: 'cr-demo-007',
    rule_id: 'NBC-4-TD-001',
    title: 'Egress Travel Path Trace',
    severity: 'ADVISORY',
    status: 'PASS',
    entity_type: 'corridor',
    geometry_hint: 'polyline',
    coordinates: {
      polyline: [
        [1.5, 1.5],
        [3.55, 3.62],
        [6.0, 4.21],
        [12.0, 4.21],
      ],
      distance_m: 12.4,
      origin_room: 'Living Room / Lounge',
      target_exit: 'Primary Emergency Exit',
    },
    label_text: 'Egress Walk: 12.4m (Pass ≤ 30.0m)',
    label_position: { x: 6.0, y: 3.9 },
    floor_level: 0,
    measured_value: 12.4,
    required_value: 30.0,
    difference: -17.6,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Table 5',
    recommendation: 'Travel distance complies safely with the statutory maximum of 30.0 m.',
    confidence: 'high',
  },
]

export const DEMO_COMPLIANCE_RESULTS: ComplianceResult[] = [
  {
    id: 'cr-demo-001',
    rule_id: 'NBC-4-CW-001',
    title: 'Corridor Clear Width — Main Egress Corridor',
    description: 'Corridor width measured at 1.18 m vs statutory requirement of 1.50 m.',
    status: 'FAIL',
    severity: 'CRITICAL',
    measured_value: 1.18,
    required_value: 1.50,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Clause 4.4.2.4.2(a)',
    confidence: 'high',
    recommendation: 'Widen corridor to at least 1.50 m clear width (shortfall: 0.32 m).',
    llm_explanation:
      'Clear corridor width is below the statutory minimum of 1.50 m for commercial/business egress corridors.',
  },
  {
    id: 'cr-demo-002',
    rule_id: 'NBC-4-DW-001',
    title: 'Door Clear Width — Bedroom 02 / Office',
    description: 'Door opening measured at 0.75 m vs statutory minimum of 0.90 m.',
    status: 'FAIL',
    severity: 'MAJOR',
    measured_value: 0.75,
    required_value: 0.90,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Clause 4.4.2.4.1(b)',
    confidence: 'high',
    recommendation: 'Replace door leaf with standard 0.90 m clear opening (shortfall: 0.15 m).',
  },
  {
    id: 'cr-demo-003',
    rule_id: 'NBC-3-RA-001',
    title: 'Habitable Room Area — Living Room / Lounge',
    description: 'Floor area measured at 25.30 m² vs statutory minimum of 9.50 m².',
    status: 'PASS',
    severity: 'ADVISORY',
    measured_value: 25.3,
    required_value: 9.5,
    unit: 'm2',
    regulation_source: 'NBC 2016 Part 3 Clause 12.2.2',
    confidence: 'high',
    recommendation: 'Space complies safely with statutory minimum habitable room area.',
  },
  {
    id: 'cr-demo-004',
    rule_id: 'NBC-3-RA-001',
    title: 'Habitable Room Area — Master Bedroom / Office 01',
    description: 'Floor area measured at 18.90 m² vs statutory minimum of 9.50 m².',
    status: 'PASS',
    severity: 'ADVISORY',
    measured_value: 18.9,
    required_value: 9.5,
    unit: 'm2',
    regulation_source: 'NBC 2016 Part 3 Clause 12.2.2',
    confidence: 'high',
    recommendation: 'Space satisfies habitable area standards.',
  },
  {
    id: 'cr-demo-005',
    rule_id: 'NBC-3-RA-001',
    title: 'Kitchen Floor Area — Kitchen / Breakroom',
    description: 'Floor area measured at 18.10 m² vs statutory minimum of 5.00 m².',
    status: 'PASS',
    severity: 'ADVISORY',
    measured_value: 18.1,
    required_value: 5.0,
    unit: 'm2',
    regulation_source: 'NBC 2016 Part 3 Clause 12.4.2',
    confidence: 'high',
    recommendation: 'Kitchen floor area exceeds statutory minimum.',
  },
  {
    id: 'cr-demo-006',
    rule_id: 'NBC-4-DW-001',
    title: 'Primary Emergency Exit Clear Width',
    description: 'Exit doorway clear width measured at 1.20 m vs minimum of 1.00 m.',
    status: 'PASS',
    severity: 'ADVISORY',
    measured_value: 1.20,
    required_value: 1.00,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Clause 4.4.2.4.1(b)',
    confidence: 'high',
    recommendation: 'Exit portal width exceeds statutory threshold.',
  },
  {
    id: 'cr-demo-007',
    rule_id: 'NBC-4-TD-001',
    title: 'Maximum Travel Distance to Exit',
    description: 'Dijkstra walking path measured at 12.40 m vs permissible limit of 30.00 m.',
    status: 'PASS',
    severity: 'ADVISORY',
    measured_value: 12.4,
    required_value: 30.0,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Clause 4.4.2.2 & Table 5',
    confidence: 'high',
    recommendation: 'Travel distance is comfortably within statutory safety limits.',
  },
]

/**
 * Transparent compliance summary:
 * 7 Total Checks: 5 Passed, 2 Findings, 0 Unverified.
 */
export const DEMO_COMPLIANCE_SUMMARY: ComplianceSummary = {
  total_checks: 7,
  passed: 5,
  failed: 2,
  unverified: 0,
  warning: 0,
  insufficient_data: 0,
  not_applicable: 0,
  compliance_score_pct: 71.4,
}

export const DEMO_GRAPH_DATA = {
  nodes: [
    { id: 'room-living', node_type: 'room', label: 'Living Room', centroid_x: 3.5, centroid_y: 1.81, floor_level: 0, confidence: 'high' },
    { id: 'room-kitchen', node_type: 'room', label: 'Kitchen / Break', centroid_x: 9.5, centroid_y: 1.81, floor_level: 0, confidence: 'high' },
    { id: 'room-corridor', node_type: 'corridor', label: 'Egress Corridor', centroid_x: 6.0, centroid_y: 4.21, floor_level: 0, confidence: 'high' },
    { id: 'room-bed1', node_type: 'room', label: 'Master Bedroom', centroid_x: 2.25, centroid_y: 6.9, floor_level: 0, confidence: 'high' },
    { id: 'room-bed2', node_type: 'room', label: 'Bedroom 02', centroid_x: 6.5, centroid_y: 6.9, floor_level: 0, confidence: 'high' },
    { id: 'room-bath', node_type: 'room', label: 'Bathroom', centroid_x: 10.25, centroid_y: 6.9, floor_level: 0, confidence: 'high' },
    { id: 'ex-main-east', node_type: 'exit', label: 'Exterior Exit 1', centroid_x: 12.0, centroid_y: 4.21, floor_level: 0, confidence: 'high' },
  ],
  edges: [
    { source_id: 'room-living', target_id: 'room-corridor', edge_type: 'door', width_m: 1.10 },
    { source_id: 'room-kitchen', target_id: 'room-corridor', edge_type: 'door', width_m: 0.90 },
    { source_id: 'room-bed1', target_id: 'room-corridor', edge_type: 'door', width_m: 0.95 },
    { source_id: 'room-bed2', target_id: 'room-corridor', edge_type: 'door', width_m: 0.75 },
    { source_id: 'room-bath', target_id: 'room-corridor', edge_type: 'door', width_m: 0.75 },
    { source_id: 'room-corridor', target_id: 'ex-main-east', edge_type: 'door', width_m: 1.20 },
  ],
  stats: { connected_components: 1, total_nodes: 7, total_edges: 6 },
}
