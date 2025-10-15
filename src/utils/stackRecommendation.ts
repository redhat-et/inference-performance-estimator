import type {
  ProjectRequirements,
  StackComponent,
  AIStackSuggestion,
  StackRecommendation,
  ComponentRecommendation,
  ArchitecturePattern,
  CostEstimate,
  TimelineEstimate,
  RiskAssessment,
  Risk,
  BudgetRange,
  StackCategory
} from '../types/stackFinder';
import { STACK_COMPONENTS } from '../data/stackComponents';

/**
 * Main function to generate AI stack recommendations based on project requirements
 */
export function generateStackRecommendations(requirements: ProjectRequirements): AIStackSuggestion {
  // Filter components based on requirements
  const eligibleComponents = filterComponentsByRequirements(requirements);

  // Group components by category
  const componentsByCategory = groupComponentsByCategory(eligibleComponents);

  // Generate recommendations for each category
  const recommendations = generateCategoryRecommendations(componentsByCategory, requirements);

  // Calculate overall score
  const overallScore = calculateOverallScore(recommendations);

  // Determine architecture pattern
  const architecture = determineArchitecturePattern(requirements);

  // Estimate costs
  const estimatedCost = estimateCosts(requirements, recommendations);

  // Create implementation timeline
  const implementationTimeline = createImplementationTimeline(requirements);

  // Assess risks
  const riskAssessment = assessRisks(requirements, recommendations);

  // Generate next steps
  const nextSteps = generateNextSteps(requirements, recommendations);

  return {
    overallScore,
    recommendations,
    architecture,
    estimatedCost,
    implementationTimeline,
    riskAssessment,
    nextSteps
  };
}

/**
 * Filter components based on project requirements
 */
function filterComponentsByRequirements(requirements: ProjectRequirements): StackComponent[] {
  return STACK_COMPONENTS.filter(component => {
    // Check language compatibility
    const languageMatch = requirements.programmingLanguages.some(lang =>
      component.supportedLanguages.includes(lang)
    );

    // Check use case compatibility
    const useCaseMatch = requirements.useCase.some(useCase =>
      component.supportedUseCases.includes(useCase)
    );

    // Check scalability requirements
    const scalabilityMatch = component.scalabilitySupport.includes(requirements.scalabilityNeeds);

    // Check deployment target compatibility
    const deploymentMatch = requirements.deploymentTarget.some(target =>
      component.deploymentTargets.includes(target)
    );

    // Check budget constraints
    const budgetMatch = isBudgetCompatible(component.minBudgetRange, requirements.budgetRange);

    // Check data type compatibility
    const dataTypeMatch = requirements.dataTypes.some(dataType =>
      component.supportedDataTypes.includes(dataType)
    );

    // Check data size compatibility
    const dataSizeMatch = component.supportedDataSizes.includes(requirements.dataSize);

    // Check compliance requirements
    const complianceMatch = requirements.complianceRequirements.every(compliance =>
      component.complianceSupport.includes(compliance)
    );

    // Check security level
    const securityMatch = component.securityFeatures.includes(requirements.securityLevel);

    return languageMatch && useCaseMatch && scalabilityMatch &&
           deploymentMatch && budgetMatch && dataTypeMatch &&
           dataSizeMatch && complianceMatch && securityMatch;
  });
}

/**
 * Group components by category
 */
function groupComponentsByCategory(components: StackComponent[]): Record<StackCategory, StackComponent[]> {
  const grouped: Record<string, StackComponent[]> = {};

  components.forEach(component => {
    if (!grouped[component.category]) {
      grouped[component.category] = [];
    }
    grouped[component.category].push(component);
  });

  return grouped as Record<StackCategory, StackComponent[]>;
}

/**
 * Generate recommendations for each category
 */
function generateCategoryRecommendations(
  componentsByCategory: Record<StackCategory, StackComponent[]>,
  requirements: ProjectRequirements
): StackRecommendation[] {
  const recommendations: StackRecommendation[] = [];

  // Define category priorities based on project type
  const categoryPriorities = getCategoryPriorities(requirements);

  for (const [category, components] of Object.entries(componentsByCategory)) {
    if (components.length === 0) continue;

    // Score and rank components in this category
    const scoredComponents = components.map(component =>
      scoreComponent(component, requirements)
    ).sort((a, b) => b.score - a.score);

    // Take top 3 as recommended, rest as alternatives
    const recommendedComponents = scoredComponents.slice(0, 3);
    const alternatives = scoredComponents.slice(3, 6);

    // Generate reasoning for this category
    const reasoning = generateCategoryReasoning(category as StackCategory, requirements);

    recommendations.push({
      category: category as StackCategory,
      recommendedComponents,
      reasoning,
      alternatives
    });
  }

  // Sort recommendations by category priority
  return recommendations.sort((a, b) => {
    const priorityA = categoryPriorities[a.category] || 10;
    const priorityB = categoryPriorities[b.category] || 10;
    return priorityA - priorityB;
  });
}

/**
 * Score a component based on how well it matches requirements
 */
function scoreComponent(component: StackComponent, requirements: ProjectRequirements): ComponentRecommendation {
  let score = 0;
  const matchReasons: string[] = [];
  const concerns: string[] = [];

  // Language compatibility (20 points)
  const languageMatches = requirements.programmingLanguages.filter(lang =>
    component.supportedLanguages.includes(lang)
  ).length;
  const languageScore = (languageMatches / requirements.programmingLanguages.length) * 20;
  score += languageScore;
  if (languageScore > 15) {
    matchReasons.push(`Excellent language support for ${requirements.programmingLanguages.join(', ')}`);
  }

  // Use case compatibility (25 points)
  const useCaseMatches = requirements.useCase.filter(useCase =>
    component.supportedUseCases.includes(useCase)
  ).length;
  const useCaseScore = (useCaseMatches / requirements.useCase.length) * 25;
  score += useCaseScore;
  if (useCaseScore > 20) {
    matchReasons.push(`Specifically designed for ${requirements.useCase.join(', ')}`);
  }

  // Maturity and stability (15 points)
  const maturityScore = getMaturityScore(component.maturityLevel);
  score += maturityScore;
  if (maturityScore > 12) {
    matchReasons.push(`Mature and stable (${component.maturityLevel})`);
  } else if (maturityScore < 8) {
    concerns.push(`Still in ${component.maturityLevel} stage`);
  }

  // Learning curve (10 points)
  const learningScore = getLearningCurveScore(component.learningCurve);
  score += learningScore;
  if (learningScore < 5) {
    concerns.push(`Steep learning curve (${component.learningCurve})`);
  }

  // Community and popularity (10 points)
  score += component.popularityScore;
  if (component.popularityScore > 8) {
    matchReasons.push(`Strong community support and popularity`);
  }

  // Performance characteristics (10 points)
  const performanceScore = getPerformanceScore(component, requirements);
  score += performanceScore;

  // Integration complexity (5 points)
  const integrationScore = getIntegrationScore(component.integrationComplexity);
  score += integrationScore;
  if (integrationScore < 2) {
    concerns.push(`Complex integration required`);
  }

  // Budget compatibility (5 points)
  const budgetScore = getBudgetScore(component.minBudgetRange, requirements.budgetRange);
  score += budgetScore;
  if (budgetScore < 3) {
    concerns.push(`May exceed budget constraints`);
  }

  return {
    component,
    score: Math.min(100, score),
    matchReasons,
    concerns,
    integrationNotes: generateIntegrationNotes(component, requirements)
  };
}

/**
 * Helper functions for scoring
 */
function getMaturityScore(maturity: string): number {
  const scores = { experimental: 3, beta: 8, stable: 12, mature: 15 };
  return scores[maturity as keyof typeof scores] || 8;
}

function getLearningCurveScore(curve: string): number {
  const scores = { easy: 10, moderate: 7, steep: 4, expert: 2 };
  return scores[curve as keyof typeof scores] || 5;
}

function getPerformanceScore(component: StackComponent, requirements: ProjectRequirements): number {
  let score = 0;

  // Latency requirements
  if (component.latencyProfile.includes(requirements.latencyRequirement)) {
    score += 5;
  }

  // Throughput requirements
  if (component.throughputProfile.includes(requirements.throughputRequirement)) {
    score += 5;
  }

  return score;
}

function getIntegrationScore(complexity: string): number {
  const scores = { simple: 5, moderate: 3, complex: 2, expert: 1 };
  return scores[complexity as keyof typeof scores] || 2;
}

function getBudgetScore(componentBudget: BudgetRange, projectBudget: BudgetRange): number {
  const budgetOrder = ['minimal', 'small', 'medium', 'large', 'enterprise'];
  const componentIndex = budgetOrder.indexOf(componentBudget);
  const projectIndex = budgetOrder.indexOf(projectBudget);

  if (componentIndex <= projectIndex) {
    return 5;
  } else if (componentIndex === projectIndex + 1) {
    return 3;
  } else {
    return 1;
  }
}

function isBudgetCompatible(componentBudget: BudgetRange, projectBudget: BudgetRange): boolean {
  const budgetOrder = ['minimal', 'small', 'medium', 'large', 'enterprise'];
  const componentIndex = budgetOrder.indexOf(componentBudget);
  const projectIndex = budgetOrder.indexOf(projectBudget);
  return componentIndex <= projectIndex;
}

/**
 * Generate category-specific reasoning
 */
function generateCategoryReasoning(category: StackCategory, requirements: ProjectRequirements): string {
  const reasoningMap: Record<StackCategory, string> = {
    'ml-framework': `Based on your ${requirements.useCase.join(', ')} use case and ${requirements.programmingLanguages.join(', ')} language preference`,
    'model-serving': `For ${requirements.latencyRequirement} latency requirements and ${requirements.deploymentTarget.join(', ')} deployment`,
    'data-storage': `Considering your ${requirements.dataSize} dataset size and ${requirements.dataTypes.join(', ')} data types`,
    'data-processing': `For handling ${requirements.dataSize} datasets with ${requirements.scalabilityNeeds} scalability needs`,
    'monitoring': `Essential for ${requirements.projectType} projects with ${requirements.securityLevel} security requirements`,
    'deployment': `Optimized for ${requirements.deploymentTarget.join(', ')} deployment targets`,
    'orchestration': `Required for ${requirements.scalabilityNeeds} scalability with ${requirements.teamSize} team size`,
    'experiment-tracking': `Important for ${requirements.projectType} projects with ${requirements.timelineWeeks}-week timeline`,
    'data-ingestion': `For processing ${requirements.dataTypes.join(', ')} data types at ${requirements.throughputRequirement} throughput`,
    'model-training': `Suitable for ${requirements.useCase.join(', ')} with ${requirements.budgetRange} budget constraints`,
    'feature-store': `Recommended for ${requirements.scalabilityNeeds} architecture with ${requirements.dataSize} data volume`,
    'model-registry': `Essential for ${requirements.projectType} projects with team collaboration needs`,
    'infrastructure': `Supporting ${requirements.deploymentTarget.join(', ')} deployment with ${requirements.securityLevel} security`,
    'security': `Meeting ${requirements.complianceRequirements.join(', ')} compliance and ${requirements.securityLevel} security level`,
    'visualization': `For monitoring and analysis of ${requirements.useCase.join(', ')} workflows`
  };

  return reasoningMap[category] || `Recommended based on your project requirements`;
}

/**
 * Calculate overall recommendation score
 */
function calculateOverallScore(recommendations: StackRecommendation[]): number {
  if (recommendations.length === 0) return 0;

  const totalScore = recommendations.reduce((sum, rec) => {
    const categoryScore = rec.recommendedComponents.reduce((catSum, comp) => catSum + comp.score, 0);
    return sum + (categoryScore / rec.recommendedComponents.length);
  }, 0);

  return Math.round(totalScore / recommendations.length);
}

/**
 * Determine architecture pattern based on requirements
 */
function determineArchitecturePattern(requirements: ProjectRequirements): ArchitecturePattern {
  if (requirements.deploymentTarget.includes('edge') || requirements.deploymentTarget.includes('mobile')) {
    return 'edge-cloud';
  }

  if (requirements.scalabilityNeeds === 'cloud-native') {
    return 'serverless';
  }

  if (requirements.scalabilityNeeds === 'distributed' || requirements.teamSize === 'large-team') {
    return 'microservices';
  }

  if (requirements.projectType === 'enterprise') {
    return 'hybrid';
  }

  return 'monolithic';
}

/**
 * Estimate project costs
 */
function estimateCosts(requirements: ProjectRequirements, recommendations: StackRecommendation[]): CostEstimate {
  const budgetRanges = {
    minimal: { min: 0, max: 1000 },
    small: { min: 1000, max: 10000 },
    medium: { min: 10000, max: 50000 },
    large: { min: 50000, max: 200000 },
    enterprise: { min: 200000, max: 1000000 }
  };

  const baseRange = budgetRanges[requirements.budgetRange];

  // Adjust based on complexity
  const complexityMultiplier = getComplexityMultiplier(requirements, recommendations);

  return {
    range: requirements.budgetRange,
    monthlyEstimate: {
      min: Math.round(baseRange.min * complexityMultiplier * 0.1),
      max: Math.round(baseRange.max * complexityMultiplier * 0.1),
      currency: 'USD'
    },
    breakdown: [
      { category: 'Infrastructure', percentage: 40, description: 'Cloud services, compute, storage' },
      { category: 'Software Licenses', percentage: 20, description: 'Commercial tools and services' },
      { category: 'Development', percentage: 30, description: 'Development and integration effort' },
      { category: 'Operations', percentage: 10, description: 'Monitoring, maintenance, support' }
    ]
  };
}

function getComplexityMultiplier(requirements: ProjectRequirements, recommendations: StackRecommendation[]): number {
  let multiplier = 1.0;

  if (requirements.scalabilityNeeds === 'distributed') multiplier += 0.5;
  if (requirements.complianceRequirements.length > 1) multiplier += 0.3;
  if (requirements.securityLevel === 'critical') multiplier += 0.4;
  if (recommendations.length > 8) multiplier += 0.2;

  return multiplier;
}

/**
 * Create implementation timeline
 */
function createImplementationTimeline(requirements: ProjectRequirements): TimelineEstimate {
  const baseWeeks = Math.max(8, requirements.timelineWeeks);

  const phases = [
    {
      name: 'Planning & Setup',
      weeks: Math.ceil(baseWeeks * 0.15),
      description: 'Environment setup, tool selection, architecture design',
      dependencies: []
    },
    {
      name: 'Data Infrastructure',
      weeks: Math.ceil(baseWeeks * 0.25),
      description: 'Data storage, processing pipeline, feature engineering',
      dependencies: ['Planning & Setup']
    },
    {
      name: 'Model Development',
      weeks: Math.ceil(baseWeeks * 0.35),
      description: 'Model training, experimentation, validation',
      dependencies: ['Data Infrastructure']
    },
    {
      name: 'Deployment & Integration',
      weeks: Math.ceil(baseWeeks * 0.20),
      description: 'Model serving, API development, system integration',
      dependencies: ['Model Development']
    },
    {
      name: 'Testing & Optimization',
      weeks: Math.ceil(baseWeeks * 0.05),
      description: 'Performance testing, monitoring setup, optimization',
      dependencies: ['Deployment & Integration']
    }
  ];

  return {
    totalWeeks: phases.reduce((sum, phase) => sum + phase.weeks, 0),
    phases
  };
}

/**
 * Assess project risks
 */
function assessRisks(requirements: ProjectRequirements, recommendations: StackRecommendation[]): RiskAssessment {
  const risks: Risk[] = [];

  // Technical complexity risk
  const complexComponents = recommendations.flatMap(rec =>
    rec.recommendedComponents.filter(comp => comp.component.integrationComplexity === 'expert')
  );
  if (complexComponents.length > 0) {
    risks.push({
      type: 'technical',
      level: 'high',
      description: 'Complex integration requirements for expert-level components',
      impact: 'May cause delays and require specialized expertise',
      probability: 0.7
    });
  }

  // Scalability risk
  if (requirements.scalabilityNeeds === 'distributed' && requirements.teamSize === 'individual') {
    risks.push({
      type: 'scalability',
      level: 'medium',
      description: 'Distributed architecture with small team',
      impact: 'May be challenging to implement and maintain',
      probability: 0.6
    });
  }

  // Budget risk
  if (requirements.budgetRange === 'minimal' && requirements.projectType === 'production') {
    risks.push({
      type: 'budget',
      level: 'high',
      description: 'Minimal budget for production deployment',
      impact: 'May limit tool choices and infrastructure options',
      probability: 0.8
    });
  }

  // Compliance risk
  if (requirements.complianceRequirements.length > 2) {
    risks.push({
      type: 'compliance',
      level: 'medium',
      description: 'Multiple compliance requirements',
      impact: 'Additional implementation complexity and audit requirements',
      probability: 0.5
    });
  }

  const overallRisk = risks.length > 2 ? 'high' : risks.length > 0 ? 'medium' : 'low';

  return {
    overallRisk,
    risks,
    mitigations: [
      'Start with MVP and iterate incrementally',
      'Invest in team training for complex technologies',
      'Consider managed services to reduce operational complexity',
      'Plan for compliance requirements early in the design phase'
    ]
  };
}

/**
 * Generate next steps recommendations
 */
function generateNextSteps(requirements: ProjectRequirements, recommendations: StackRecommendation[]): string[] {
  const steps: string[] = [];

  // Always start with planning
  steps.push('Define detailed project requirements and success metrics');

  // Environment setup
  const hasInfrastructure = recommendations.some(rec =>
    rec.category === 'deployment' || rec.category === 'orchestration'
  );
  if (hasInfrastructure) {
    steps.push('Set up development and staging environments');
  }

  // Data preparation
  const hasDataComponents = recommendations.some(rec =>
    rec.category === 'data-storage' || rec.category === 'data-processing'
  );
  if (hasDataComponents) {
    steps.push('Prepare and validate your datasets');
  }

  // Framework selection
  const mlFrameworks = recommendations.find(rec => rec.category === 'ml-framework');
  if (mlFrameworks && mlFrameworks.recommendedComponents.length > 0) {
    const topFramework = mlFrameworks.recommendedComponents[0].component.name;
    steps.push(`Start with ${topFramework} for initial prototyping`);
  }

  // Monitoring and tracking
  const hasMonitoring = recommendations.some(rec =>
    rec.category === 'monitoring' || rec.category === 'experiment-tracking'
  );
  if (hasMonitoring) {
    steps.push('Implement experiment tracking and monitoring early');
  }

  // Team preparation
  if (requirements.teamSize !== 'individual') {
    steps.push('Establish development workflows and collaboration practices');
  }

  // Final recommendations
  steps.push('Build a minimal viable product (MVP) first');
  steps.push('Plan for iterative improvements and scaling');

  return steps;
}

/**
 * Generate integration notes for a component
 */
function generateIntegrationNotes(component: StackComponent, requirements: ProjectRequirements): string | undefined {
  const notes: string[] = [];

  if (component.dependencies.length > 0) {
    notes.push(`Requires: ${component.dependencies.join(', ')}`);
  }

  if (component.integrationComplexity === 'expert') {
    notes.push('Consider hiring specialists or using managed services');
  }

  if (requirements.deploymentTarget.includes('edge') && !component.deploymentTargets.includes('edge')) {
    notes.push('May need additional optimization for edge deployment');
  }

  return notes.length > 0 ? notes.join('. ') : undefined;
}

/**
 * Get category priorities based on project type
 */
function getCategoryPriorities(requirements: ProjectRequirements): Record<StackCategory, number> {
  const basePriorities: Record<StackCategory, number> = {
    'ml-framework': 1,
    'data-processing': 2,
    'data-storage': 3,
    'model-training': 4,
    'model-serving': 5,
    'deployment': 6,
    'monitoring': 7,
    'experiment-tracking': 8,
    'orchestration': 9,
    'infrastructure': 10,
    'security': 11,
    'feature-store': 12,
    'model-registry': 13,
    'data-ingestion': 14,
    'visualization': 15
  };

  // Adjust priorities based on project type
  if (requirements.projectType === 'research') {
    basePriorities['experiment-tracking'] = 3;
    basePriorities['visualization'] = 4;
  } else if (requirements.projectType === 'production') {
    basePriorities['monitoring'] = 3;
    basePriorities['security'] = 4;
    basePriorities['deployment'] = 2;
  }

  return basePriorities;
}
