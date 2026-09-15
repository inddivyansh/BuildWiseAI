/**
 * Canonical Geometry Model (CGM) — Frontend TypeScript Contracts
 * Mirrored from backend/engines/geometry/models.py
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'inferred'

export type RoomType =
  | 'bedroom'
  | 'living_room'
  | 'kitchen'
  | 'bathroom'
  | 'toilet'
  | 'corridor'
  | 'stairwell'
  | 'lobby'
  | 'office'
  | 'hall'
  | 'balcony'
  | 'utility'
  | 'storage'
  | 'parking'
  | 'commercial'
  | 'exit_discharge'
  | 'unknown'

export type WallType = 'exterior' | 'interior' | 'structural' | 'partition' | 'unknown'

export type OpeningType = 'door' | 'window' | 'sliding_door' | 'double_door' | 'emergency_exit' | 'opening'

export interface Point2D {
  x: number
  y: number
}

export interface LineSegment {
  start: Point2D
  end: Point2D
}

export interface Polygon2D {
  vertices: Point2D[]
}

export interface CGMWall {
  id: string
  wall_type: WallType
  segments: LineSegment[]
  thickness_m?: number
  height_m?: number
  floor_level: number
  confidence: ConfidenceLevel
  source_layer?: string
}

export interface CGMOpening {
  id: string
  opening_type: OpeningType
  position: Point2D
  width_m: number
  height_m?: number
  swing_angle_deg?: number
  swing_direction?: string
  wall_id?: string
  room_ids?: string[]
  floor_level: number
  confidence: ConfidenceLevel
  source_layer?: string
}

export interface CGMRoom {
  id: string
  room_type: RoomType
  label?: string
  boundary: Polygon2D
  area_m2?: number
  perimeter_m?: number
  width_m?: number
  length_m?: number
  height_m?: number
  floor_level: number
  confidence: ConfidenceLevel
  source_layer?: string
  wall_ids?: string[]
  opening_ids?: string[]
}

export interface CGMStair {
  id: string
  position: Point2D
  width_m: number
  riser_count?: number
  tread_depth_m?: number
  riser_height_m?: number
  floor_level: number
  confidence: ConfidenceLevel
}

export interface CGMExit {
  id: string
  position: Point2D
  exit_type: string
  width_m?: number
  floor_level: number
  confidence: ConfidenceLevel
}

export interface CGMFloor {
  level: number
  elevation_m: number
  height_m?: number
  rooms: CGMRoom[]
  walls: CGMWall[]
  openings: CGMOpening[]
  stairs: CGMStair[]
  exits: CGMExit[]
}

export interface CGMBoundingBox {
  xmin: number
  ymin: number
  xmax: number
  ymax: number
}

export interface CGMMetadata {
  source_format: string
  source_filename: string
  extraction_method: string
  coordinate_unit: string
  original_unit?: string
  scale_factor?: number
  is_multi_floor: boolean
  extraction_warnings: string[]
  extraction_errors: string[]
}

export interface CanonicalFloorPlan {
  id: string
  version: string
  bounding_box: CGMBoundingBox
  floors: CGMFloor[]
  metadata: CGMMetadata
  total_area_m2?: number
  floor_count: number
  graph?: {
    nodes: Array<{
      id: string
      node_type: string
      label?: string
      room_type?: string
      area_m2?: number
      centroid_x: number
      centroid_y: number
      floor_level: number
      confidence: string
    }>
    edges: Array<{
      source_id: string
      target_id: string
      edge_type: string
      width_m?: number
    }>
    stats: Record<string, any>
  }
}
