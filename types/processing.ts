export enum ProcessingType {
  SPECTRAL_INDEX = 'spectral_index',
  CLASSIFICATION = 'classification',
  CHANGE_DETECTION = 'change_detection',
  ZONAL_STATISTICS = 'zonal_statistics',
  TEMPORAL_COMPOSITE = 'temporal_composite',
  BAND_MATH = 'band_math',
  MASK_EXTRACTION = 'mask_extraction',
}

export enum AggregationMethod {
  MEAN = 'mean',
  MEDIAN = 'median',
  MAX = 'max',
  MIN = 'min',
  STD = 'std',
  FIRST = 'first',
  LAST = 'last',
  COUNT = 'count',
}

export enum SpectralIndex {
  NDVI = 'ndvi',
  NDWI = 'ndwi',
  EVI = 'evi',
  SAVI = 'savi',
  NDBI = 'ndbi',
  BAI = 'bai',
  MNDWI = 'mndwi',
  GNDVI = 'gndvi',
  NDSI = 'ndsi',
  NBR = 'nbr',
  CUSTOM = 'custom',
}

export interface ProcessingRequest {
  type: ProcessingType
  scene_ids?: string[]
  mosaic_id?: string
  aoi?: GeoJSON.Polygon
  aggregation_method?: AggregationMethod
  parameters?: Record<string, unknown>
  name?: string
}

export interface SpectralIndexRequest extends ProcessingRequest {
  index_type: SpectralIndex
  expression?: string
  color_map?: string
  value_range?: [number, number]
}

export interface ProcessingJob {
  job_id: string
  type: ProcessingType
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
  scene_ids?: string[]
  mosaic_id?: string
  progress?: number
  stage?: string
  message?: string
  result_url?: string
  result_data?: Record<string, unknown>
  output_files?: string[]
  parameters?: Record<string, unknown>
  error?: string
  execution_time?: number
}
