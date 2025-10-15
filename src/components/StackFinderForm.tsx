import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Slider,
  Checkbox,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Paper,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  AutoAwesome as MagicIcon,
} from '@mui/icons-material';
import type {
  ProjectRequirements,
  ProjectType,
  UseCase,
  ProgrammingLanguage,
  ScalabilityLevel,
  DeploymentTarget,
  BudgetRange,
  TeamSize,
  LatencyRequirement,
  ThroughputRequirement,
  DataSize,
  DataType,
  ComplianceRequirement,
  SecurityLevel,
} from '../types/stackFinder';
import { DEFAULT_PROJECT_REQUIREMENTS } from '../types/stackFinder';
import { HuggingFaceModelSearch } from './HuggingFaceModelSearch';
import type { ModelPreset } from '../types/calculator';

interface StackFinderFormProps {
  onRequirementsChange: (requirements: ProjectRequirements) => void;
  onGenerateRecommendations: () => void;
  isGenerating?: boolean;
}

const FORM_STEPS = [
  'Model Selection',
  'Project Basics',
  'Technical Requirements',
  'Data & Performance',
  'Constraints & Security'
];

const PROJECT_TYPES: { value: ProjectType; label: string; description: string }[] = [
  { value: 'research', label: 'Research', description: 'Academic or experimental project' },
  { value: 'prototype', label: 'Prototype', description: 'Proof of concept or MVP' },
  { value: 'production', label: 'Production', description: 'Live system serving users' },
  { value: 'enterprise', label: 'Enterprise', description: 'Large-scale business application' },
];

const USE_CASES: { value: UseCase; label: string; description: string }[] = [
  { value: 'natural-language-processing', label: 'Natural Language Processing', description: 'Text analysis, chatbots, translation' },
  { value: 'computer-vision', label: 'Computer Vision', description: 'Image/video analysis, object detection' },
  { value: 'speech-recognition', label: 'Speech Recognition', description: 'Voice processing, transcription' },
  { value: 'recommendation-systems', label: 'Recommendation Systems', description: 'Personalized content suggestions' },
  { value: 'time-series-forecasting', label: 'Time Series Forecasting', description: 'Predictive analytics over time' },
  { value: 'generative-ai', label: 'Generative AI', description: 'Content generation, LLMs, diffusion models' },
  { value: 'robotics', label: 'Robotics', description: 'Robot control and automation' },
  { value: 'autonomous-systems', label: 'Autonomous Systems', description: 'Self-driving, autonomous navigation' },
  { value: 'fraud-detection', label: 'Fraud Detection', description: 'Anomaly detection, security' },
  { value: 'predictive-maintenance', label: 'Predictive Maintenance', description: 'Equipment monitoring and prediction' },
  { value: 'content-moderation', label: 'Content Moderation', description: 'Automated content filtering' },
  { value: 'search-ranking', label: 'Search & Ranking', description: 'Information retrieval systems' },
];

const PROGRAMMING_LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'r', label: 'R' },
  { value: 'julia', label: 'Julia' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
];

const SCALABILITY_LEVELS: { value: ScalabilityLevel; label: string; description: string }[] = [
  { value: 'single-machine', label: 'Single Machine', description: 'Runs on one server/computer' },
  { value: 'multi-machine', label: 'Multi-Machine', description: 'Distributed across multiple servers' },
  { value: 'distributed', label: 'Distributed', description: 'Highly scalable distributed system' },
  { value: 'cloud-native', label: 'Cloud Native', description: 'Serverless and auto-scaling' },
];

const DEPLOYMENT_TARGETS: { value: DeploymentTarget; label: string }[] = [
  { value: 'cloud', label: 'Cloud' },
  { value: 'on-premise', label: 'On-Premise' },
  { value: 'edge', label: 'Edge' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'embedded', label: 'Embedded' },
  { value: 'hybrid', label: 'Hybrid' },
];

const BUDGET_RANGES: { value: BudgetRange; label: string; description: string }[] = [
  { value: 'minimal', label: 'Minimal ($0-1K/month)', description: 'Open source tools, basic cloud resources' },
  { value: 'small', label: 'Small ($1K-10K/month)', description: 'Some commercial tools, moderate cloud usage' },
  { value: 'medium', label: 'Medium ($10K-50K/month)', description: 'Professional tools, substantial infrastructure' },
  { value: 'large', label: 'Large ($50K-200K/month)', description: 'Enterprise tools, high-performance infrastructure' },
  { value: 'enterprise', label: 'Enterprise ($200K+/month)', description: 'Premium solutions, unlimited resources' },
];

const TEAM_SIZES: { value: TeamSize; label: string }[] = [
  { value: 'individual', label: 'Individual (1 person)' },
  { value: 'small-team', label: 'Small Team (2-5 people)' },
  { value: 'medium-team', label: 'Medium Team (6-15 people)' },
  { value: 'large-team', label: 'Large Team (15+ people)' },
];

const LATENCY_REQUIREMENTS: { value: LatencyRequirement; label: string; description: string }[] = [
  { value: 'real-time', label: 'Real-time (<100ms)', description: 'Interactive applications' },
  { value: 'near-real-time', label: 'Near Real-time (<1s)', description: 'Live dashboards, chat' },
  { value: 'batch', label: 'Batch (minutes/hours)', description: 'Offline processing' },
  { value: 'flexible', label: 'Flexible', description: 'No strict requirements' },
];

const THROUGHPUT_REQUIREMENTS: { value: ThroughputRequirement; label: string }[] = [
  { value: 'low', label: 'Low (<100 requests/sec)' },
  { value: 'medium', label: 'Medium (100-1K requests/sec)' },
  { value: 'high', label: 'High (1K-10K requests/sec)' },
  { value: 'very-high', label: 'Very High (10K+ requests/sec)' },
];

const DATA_SIZES: { value: DataSize; label: string; description: string }[] = [
  { value: 'small', label: 'Small (<1GB)', description: 'Fits in memory' },
  { value: 'medium', label: 'Medium (1GB-100GB)', description: 'Single machine processing' },
  { value: 'large', label: 'Large (100GB-10TB)', description: 'Distributed processing needed' },
  { value: 'very-large', label: 'Very Large (10TB+)', description: 'Big data infrastructure required' },
];

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'images', label: 'Images' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'tabular', label: 'Tabular' },
  { value: 'time-series', label: 'Time Series' },
  { value: 'graph', label: 'Graph' },
  { value: 'multimodal', label: 'Multimodal' },
];

const COMPLIANCE_REQUIREMENTS: { value: ComplianceRequirement; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'gdpr', label: 'GDPR' },
  { value: 'hipaa', label: 'HIPAA' },
  { value: 'sox', label: 'SOX' },
  { value: 'pci-dss', label: 'PCI-DSS' },
  { value: 'iso-27001', label: 'ISO 27001' },
];

const SECURITY_LEVELS: { value: SecurityLevel; label: string; description: string }[] = [
  { value: 'basic', label: 'Basic', description: 'Standard security practices' },
  { value: 'standard', label: 'Standard', description: 'Industry-standard security' },
  { value: 'high', label: 'High', description: 'Enhanced security measures' },
  { value: 'critical', label: 'Critical', description: 'Maximum security requirements' },
];

export const StackFinderForm: React.FC<StackFinderFormProps> = ({
  onRequirementsChange,
  onGenerateRecommendations,
  isGenerating = false
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [requirements, setRequirements] = useState<ProjectRequirements>(DEFAULT_PROJECT_REQUIREMENTS);
  const [selectedModel, setSelectedModel] = useState<ModelPreset | null>(null);
  const [modelError, setModelError] = useState<string>('');

  const handleRequirementChange = <K extends keyof ProjectRequirements>(
    field: K,
    value: ProjectRequirements[K]
  ) => {
    const updatedRequirements = { ...requirements, [field]: value };
    setRequirements(updatedRequirements);
    onRequirementsChange(updatedRequirements);
  };

  const handleModelLoad = (model: ModelPreset) => {
    setSelectedModel(model);
    const updatedRequirements = {
      ...requirements,
      selectedModel: {
        name: model.name,
        parameters: model.parameters,
        sequenceLength: model.sequenceLength,
        isFromHub: model.isFromHub,
        hubUrl: model.hubUrl,
      }
    };
    setRequirements(updatedRequirements);
    onRequirementsChange(updatedRequirements);
    setModelError('');
  };

  const handleModelError = (error: string) => {
    setModelError(error);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0:
        return selectedModel !== null;
      case 1:
        return requirements.projectType !== undefined && requirements.useCase.length > 0;
      case 2:
        return requirements.programmingLanguages.length > 0 && requirements.scalabilityNeeds !== undefined;
      case 3:
        return requirements.dataTypes.length > 0 && requirements.dataSize !== undefined;
      case 4:
        return requirements.budgetRange !== undefined && requirements.securityLevel !== undefined;
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(activeStep);
  const isLastStep = activeStep === FORM_STEPS.length - 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MagicIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              AI Stack Finder
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Answer a few questions about your AI project to get personalized technology stack recommendations.
            We'll suggest the best tools, frameworks, and services based on your specific requirements.
          </Typography>
        </CardContent>
      </Card>

      {/* Form Stepper */}
      <Card elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 0: Model Selection */}
            <Step>
              <StepLabel>Model Selection</StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select an AI model from HuggingFace Hub to help us recommend the right infrastructure and tools for your stack.
                  </Typography>

                  {/* HuggingFace Model Search */}
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <HuggingFaceModelSearch
                      onModelLoad={handleModelLoad}
                      onError={handleModelError}
                    />
                  </Paper>

                  {/* Display current model info */}
                  {selectedModel && (
                    <Alert
                      severity="success"
                      sx={{
                        '& .MuiAlert-message': {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5
                        }
                      }}
                    >
                      <Typography variant="subtitle2">
                        Selected Model: {selectedModel.name}
                      </Typography>
                      <Typography variant="caption">
                        Parameters: {selectedModel.parameters}B • Sequence Length: {selectedModel.sequenceLength}
                      </Typography>
                      {selectedModel.isFromHub && (
                        <Typography variant="caption">
                          <a
                            href={selectedModel.hubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit' }}
                          >
                            View on HuggingFace Hub →
                          </a>
                        </Typography>
                      )}
                    </Alert>
                  )}

                  {/* Model Error Display */}
                  {modelError && (
                    <Alert severity="error" onClose={() => setModelError('')}>
                      {modelError}
                    </Alert>
                  )}
                </Box>
              </StepContent>
            </Step>

            {/* Step 1: Project Basics */}
            <Step>
              <StepLabel>Project Basics</StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2 }}>
                  {/* Project Type */}
                  <FormControl fullWidth>
                    <InputLabel>Project Type</InputLabel>
                    <Select
                      value={requirements.projectType}
                      label="Project Type"
                      onChange={(e) => handleRequirementChange('projectType', e.target.value as ProjectType)}
                    >
                      {PROJECT_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {type.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Use Cases */}
                  <FormControl fullWidth>
                    <InputLabel>Use Cases</InputLabel>
                    <Select
                      multiple
                      value={requirements.useCase}
                      onChange={(e) => handleRequirementChange('useCase', e.target.value as UseCase[])}
                      input={<OutlinedInput label="Use Cases" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const useCase = USE_CASES.find(uc => uc.value === value);
                            return <Chip key={value} label={useCase?.label} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {USE_CASES.map((useCase) => (
                        <MenuItem key={useCase.value} value={useCase.value}>
                          <Checkbox checked={requirements.useCase.includes(useCase.value)} />
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {useCase.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {useCase.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Team Size */}
                  <FormControl fullWidth>
                    <InputLabel>Team Size</InputLabel>
                    <Select
                      value={requirements.teamSize}
                      label="Team Size"
                      onChange={(e) => handleRequirementChange('teamSize', e.target.value as TeamSize)}
                    >
                      {TEAM_SIZES.map((size) => (
                        <MenuItem key={size.value} value={size.value}>
                          {size.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Timeline */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
                      Project Timeline: {requirements.timelineWeeks} weeks
                    </Typography>
                    <Slider
                      value={requirements.timelineWeeks}
                      onChange={(_, value) => handleRequirementChange('timelineWeeks', value as number)}
                      min={4}
                      max={52}
                      step={2}
                      marks={[
                        { value: 4, label: '4w' },
                        { value: 12, label: '12w' },
                        { value: 26, label: '26w' },
                        { value: 52, label: '52w' },
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Technical Requirements */}
            <Step>
              <StepLabel>Technical Requirements</StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2 }}>
                  {/* Programming Languages */}
                  <FormControl fullWidth>
                    <InputLabel>Programming Languages</InputLabel>
                    <Select
                      multiple
                      value={requirements.programmingLanguages}
                      onChange={(e) => handleRequirementChange('programmingLanguages', e.target.value as ProgrammingLanguage[])}
                      input={<OutlinedInput label="Programming Languages" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const lang = PROGRAMMING_LANGUAGES.find(l => l.value === value);
                            return <Chip key={value} label={lang?.label} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {PROGRAMMING_LANGUAGES.map((lang) => (
                        <MenuItem key={lang.value} value={lang.value}>
                          <Checkbox checked={requirements.programmingLanguages.includes(lang.value)} />
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Scalability Needs */}
                  <FormControl fullWidth>
                    <InputLabel>Scalability Requirements</InputLabel>
                    <Select
                      value={requirements.scalabilityNeeds}
                      label="Scalability Requirements"
                      onChange={(e) => handleRequirementChange('scalabilityNeeds', e.target.value as ScalabilityLevel)}
                    >
                      {SCALABILITY_LEVELS.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {level.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {level.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Deployment Targets */}
                  <FormControl fullWidth>
                    <InputLabel>Deployment Targets</InputLabel>
                    <Select
                      multiple
                      value={requirements.deploymentTarget}
                      onChange={(e) => handleRequirementChange('deploymentTarget', e.target.value as DeploymentTarget[])}
                      input={<OutlinedInput label="Deployment Targets" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const target = DEPLOYMENT_TARGETS.find(t => t.value === value);
                            return <Chip key={value} label={target?.label} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {DEPLOYMENT_TARGETS.map((target) => (
                        <MenuItem key={target.value} value={target.value}>
                          <Checkbox checked={requirements.deploymentTarget.includes(target.value)} />
                          {target.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Data & Performance */}
            <Step>
              <StepLabel>Data & Performance</StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2 }}>
                  {/* Data Types */}
                  <FormControl fullWidth>
                    <InputLabel>Data Types</InputLabel>
                    <Select
                      multiple
                      value={requirements.dataTypes}
                      onChange={(e) => handleRequirementChange('dataTypes', e.target.value as DataType[])}
                      input={<OutlinedInput label="Data Types" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const dataType = DATA_TYPES.find(dt => dt.value === value);
                            return <Chip key={value} label={dataType?.label} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {DATA_TYPES.map((dataType) => (
                        <MenuItem key={dataType.value} value={dataType.value}>
                          <Checkbox checked={requirements.dataTypes.includes(dataType.value)} />
                          {dataType.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Data Size */}
                  <FormControl fullWidth>
                    <InputLabel>Data Size</InputLabel>
                    <Select
                      value={requirements.dataSize}
                      label="Data Size"
                      onChange={(e) => handleRequirementChange('dataSize', e.target.value as DataSize)}
                    >
                      {DATA_SIZES.map((size) => (
                        <MenuItem key={size.value} value={size.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {size.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {size.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Latency Requirements */}
                  <FormControl fullWidth>
                    <InputLabel>Latency Requirements</InputLabel>
                    <Select
                      value={requirements.latencyRequirement}
                      label="Latency Requirements"
                      onChange={(e) => handleRequirementChange('latencyRequirement', e.target.value as LatencyRequirement)}
                    >
                      {LATENCY_REQUIREMENTS.map((latency) => (
                        <MenuItem key={latency.value} value={latency.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {latency.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {latency.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Throughput Requirements */}
                  <FormControl fullWidth>
                    <InputLabel>Throughput Requirements</InputLabel>
                    <Select
                      value={requirements.throughputRequirement}
                      label="Throughput Requirements"
                      onChange={(e) => handleRequirementChange('throughputRequirement', e.target.value as ThroughputRequirement)}
                    >
                      {THROUGHPUT_REQUIREMENTS.map((throughput) => (
                        <MenuItem key={throughput.value} value={throughput.value}>
                          {throughput.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Constraints & Security */}
            <Step>
              <StepLabel>Constraints & Security</StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2 }}>
                  {/* Budget Range */}
                  <FormControl fullWidth>
                    <InputLabel>Budget Range</InputLabel>
                    <Select
                      value={requirements.budgetRange}
                      label="Budget Range"
                      onChange={(e) => handleRequirementChange('budgetRange', e.target.value as BudgetRange)}
                    >
                      {BUDGET_RANGES.map((budget) => (
                        <MenuItem key={budget.value} value={budget.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {budget.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {budget.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Security Level */}
                  <FormControl fullWidth>
                    <InputLabel>Security Level</InputLabel>
                    <Select
                      value={requirements.securityLevel}
                      label="Security Level"
                      onChange={(e) => handleRequirementChange('securityLevel', e.target.value as SecurityLevel)}
                    >
                      {SECURITY_LEVELS.map((security) => (
                        <MenuItem key={security.value} value={security.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {security.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {security.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Compliance Requirements */}
                  <FormControl fullWidth>
                    <InputLabel>Compliance Requirements</InputLabel>
                    <Select
                      multiple
                      value={requirements.complianceRequirements}
                      onChange={(e) => handleRequirementChange('complianceRequirements', e.target.value as ComplianceRequirement[])}
                      input={<OutlinedInput label="Compliance Requirements" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const compliance = COMPLIANCE_REQUIREMENTS.find(c => c.value === value);
                            return <Chip key={value} label={compliance?.label} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {COMPLIANCE_REQUIREMENTS.map((compliance) => (
                        <MenuItem key={compliance.value} value={compliance.value}>
                          <Checkbox checked={requirements.complianceRequirements.includes(compliance.value)} />
                          {compliance.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </StepContent>
            </Step>
          </Stepper>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<BackIcon />}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isLastStep ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!canProceed}
                  endIcon={<NextIcon />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={onGenerateRecommendations}
                  disabled={!canProceed || isGenerating}
                  startIcon={<MagicIcon />}
                  size="large"
                  sx={{ px: 4 }}
                >
                  {isGenerating ? 'Generating...' : 'Generate AI Stack Recommendations'}
                </Button>
              )}
            </Box>
          </Box>

          {/* Progress Indicator */}
          {isLastStep && canProceed && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Great! All requirements are complete. Click "Generate AI Stack Recommendations" to get your personalized technology stack suggestions.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
