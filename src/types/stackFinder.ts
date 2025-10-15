export interface ProjectRequirements {
  // Project basics
  projectType: ProjectType;
  useCase: UseCase[];

  // Technical requirements
  programmingLanguages: ProgrammingLanguage[];
  scalabilityNeeds: ScalabilityLevel;
  deploymentTarget: DeploymentTarget[];

  // Constraints
  budgetRange: BudgetRange;
  teamSize: TeamSize;
  timelineWeeks: number;

  // Performance requirements
  latencyRequirement: LatencyRequirement;
  throughputRequirement: ThroughputRequirement;

  // Data requirements
  dataSize: DataSize;
  dataTypes: DataType[];

  // Compliance and security
  complianceRequirements: ComplianceRequirement[];
  securityLevel: SecurityLevel;

  // Model requirements
  selectedModel?: {
    name: string;
    parameters: number;
    sequenceLength: number;
    isFromHub?: boolean;
    hubUrl?: string;
  };
}

export type ProjectType =
  | 'research'
  | 'prototype'
  | 'production'
  | 'enterprise';

export type UseCase =
  | 'natural-language-processing'
  | 'computer-vision'
  | 'speech-recognition'
  | 'recommendation-systems'
  | 'time-series-forecasting'
  | 'generative-ai'
  | 'robotics'
  | 'autonomous-systems'
  | 'fraud-detection'
  | 'predictive-maintenance'
  | 'content-moderation'
  | 'search-ranking';

export type ProgrammingLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'cpp'
  | 'rust'
  | 'go'
  | 'r'
  | 'julia'
  | 'swift'
  | 'kotlin';

export type ScalabilityLevel =
  | 'single-machine'
  | 'multi-machine'
  | 'distributed'
  | 'cloud-native';

export type DeploymentTarget =
  | 'cloud'
  | 'on-premise'
  | 'edge'
  | 'mobile'
  | 'embedded'
  | 'hybrid';

export type BudgetRange =
  | 'minimal'
  | 'small'
  | 'medium'
  | 'large'
  | 'enterprise';

export type TeamSize =
  | 'individual'
  | 'small-team'
  | 'medium-team'
  | 'large-team';

export type LatencyRequirement =
  | 'real-time'
  | 'near-real-time'
  | 'batch'
  | 'flexible';

export type ThroughputRequirement =
  | 'low'
  | 'medium'
  | 'high'
  | 'very-high';

export type DataSize =
  | 'small'
  | 'medium'
  | 'large'
  | 'very-large';

export type DataType =
  | 'text'
  | 'images'
  | 'audio'
  | 'video'
  | 'tabular'
  | 'time-series'
  | 'graph'
  | 'multimodal';

export type ComplianceRequirement =
  | 'gdpr'
  | 'hipaa'
  | 'sox'
  | 'pci-dss'
  | 'iso-27001'
  | 'none';

export type SecurityLevel =
  | 'basic'
  | 'standard'
  | 'high'
  | 'critical';

export interface StackComponent {
  id: string;
  name: string;
  category: StackCategory;
  description: string;

  // Technical details
  supportedLanguages: ProgrammingLanguage[];
  supportedUseCases: UseCase[];
  scalabilitySupport: ScalabilityLevel[];
  deploymentTargets: DeploymentTarget[];

  // Requirements
  minBudgetRange: BudgetRange;
  learningCurve: LearningCurve;
  maturityLevel: MaturityLevel;

  // Performance characteristics
  latencyProfile: LatencyRequirement[];
  throughputProfile: ThroughputRequirement[];

  // Data support
  supportedDataTypes: DataType[];
  supportedDataSizes: DataSize[];

  // Compliance and security
  complianceSupport: ComplianceRequirement[];
  securityFeatures: SecurityLevel[];

  // Metadata
  vendor: string;
  license: LicenseType;
  documentationUrl: string;
  githubUrl?: string;
  websiteUrl: string;

  // Integration
  integrationComplexity: IntegrationComplexity;
  dependencies: string[];
  alternatives: string[];

  // Popularity and community
  popularityScore: number; // 1-10
  communitySize: CommunitySize;
  lastUpdated: string;
}

export type StackCategory =
  | 'data-ingestion'
  | 'data-processing'
  | 'data-storage'
  | 'ml-framework'
  | 'model-training'
  | 'model-serving'
  | 'monitoring'
  | 'orchestration'
  | 'feature-store'
  | 'experiment-tracking'
  | 'model-registry'
  | 'deployment'
  | 'infrastructure'
  | 'security'
  | 'visualization';

export type LearningCurve =
  | 'easy'
  | 'moderate'
  | 'steep'
  | 'expert';

export type MaturityLevel =
  | 'experimental'
  | 'beta'
  | 'stable'
  | 'mature';

export type LicenseType =
  | 'open-source'
  | 'commercial'
  | 'freemium'
  | 'enterprise';

export type IntegrationComplexity =
  | 'simple'
  | 'moderate'
  | 'complex'
  | 'expert';

export type CommunitySize =
  | 'small'
  | 'medium'
  | 'large'
  | 'very-large';

export interface StackRecommendation {
  category: StackCategory;
  recommendedComponents: ComponentRecommendation[];
  reasoning: string;
  alternatives: ComponentRecommendation[];
}

export interface ComponentRecommendation {
  component: StackComponent;
  score: number; // 0-100
  matchReasons: string[];
  concerns: string[];
  integrationNotes?: string;
}

export interface AIStackSuggestion {
  overallScore: number; // 0-100
  recommendations: StackRecommendation[];
  architecture: ArchitecturePattern;
  estimatedCost: CostEstimate;
  implementationTimeline: TimelineEstimate;
  riskAssessment: RiskAssessment;
  nextSteps: string[];
}

export type ArchitecturePattern =
  | 'monolithic'
  | 'microservices'
  | 'serverless'
  | 'hybrid'
  | 'edge-cloud';

export interface CostEstimate {
  range: BudgetRange;
  monthlyEstimate?: {
    min: number;
    max: number;
    currency: string;
  };
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: string;
  percentage: number;
  description: string;
}

export interface TimelineEstimate {
  totalWeeks: number;
  phases: TimelinePhase[];
}

export interface TimelinePhase {
  name: string;
  weeks: number;
  description: string;
  dependencies: string[];
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  risks: Risk[];
  mitigations: string[];
}

export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface Risk {
  type: RiskType;
  level: RiskLevel;
  description: string;
  impact: string;
  probability: number; // 0-1
}

export type RiskType =
  | 'technical'
  | 'integration'
  | 'scalability'
  | 'security'
  | 'compliance'
  | 'vendor-lock-in'
  | 'skill-gap'
  | 'budget'
  | 'timeline';

// Default values for form initialization
export const DEFAULT_PROJECT_REQUIREMENTS: ProjectRequirements = {
  projectType: 'prototype',
  useCase: ['natural-language-processing'],
  programmingLanguages: ['python'],
  scalabilityNeeds: 'single-machine',
  deploymentTarget: ['cloud'],
  budgetRange: 'small',
  teamSize: 'small-team',
  timelineWeeks: 12,
  latencyRequirement: 'flexible',
  throughputRequirement: 'medium',
  dataSize: 'medium',
  dataTypes: ['text'],
  complianceRequirements: ['none'],
  securityLevel: 'standard',
};

