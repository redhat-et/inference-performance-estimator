import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Link,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Architecture as ArchitectureIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import type { AIStackSuggestion, RiskLevel } from '../types/stackFinder';

interface StackRecommendationsProps {
  suggestions: AIStackSuggestion;
}

const getRiskColor = (level: RiskLevel): 'success' | 'warning' | 'error' => {
  switch (level) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
    case 'critical':
      return 'error';
  }
};

const getRiskIcon = (level: RiskLevel) => {
  switch (level) {
    case 'low':
      return <CheckIcon color="success" />;
    case 'medium':
      return <WarningIcon color="warning" />;
    case 'high':
    case 'critical':
      return <ErrorIcon color="error" />;
  }
};

export const StackRecommendations: React.FC<StackRecommendationsProps> = ({ suggestions }) => {
  const [expandedPanel, setExpandedPanel] = useState<string | false>('recommendations');

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Overall Score Card */}
      <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {suggestions.overallScore}%
              </Typography>
              <Typography variant="body1">
                Overall Match Score
              </Typography>
            </Box>
            <TrendingUpIcon sx={{ fontSize: 60, opacity: 0.5 }} />
          </Box>
          <LinearProgress
            variant="determinate"
            value={suggestions.overallScore}
            sx={{
              mt: 2,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Architecture Pattern */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ArchitectureIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Recommended Architecture
          </Typography>
        </Box>
        <Chip
          label={suggestions.architecture.toUpperCase().replace('-', ' ')}
          color="primary"
          sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 2 }}
        />
      </Paper>

      {/* Stack Recommendations */}
      <Accordion
        expanded={expandedPanel === 'recommendations'}
        onChange={handleAccordionChange('recommendations')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Technology Stack Recommendations
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {suggestions.recommendations.map((recommendation, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, textTransform: 'capitalize' }}>
                  {recommendation.category.replace('-', ' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {recommendation.reasoning}
                </Typography>

                {/* Recommended Components */}
                {recommendation.recommendedComponents.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                      Recommended:
                    </Typography>
                    {recommendation.recommendedComponents.map((compRec, idx) => (
                      <Box key={idx} sx={{ mb: 2, pl: 2, borderLeft: 3, borderColor: 'success.main' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {compRec.component.name}
                          </Typography>
                          <Chip
                            label={`${compRec.score}% match`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {compRec.component.description}
                        </Typography>
                        {compRec.component.websiteUrl && (
                          <Link
                            href={compRec.component.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{ display: 'block', mb: 1 }}
                          >
                            Visit Website →
                          </Link>
                        )}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {compRec.matchReasons.slice(0, 3).map((reason, rIdx) => (
                            <Chip key={rIdx} label={reason} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Alternative Components */}
                {recommendation.alternatives.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium', color: 'text.secondary' }}>
                      Alternatives:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {recommendation.alternatives.map((alt, idx) => (
                        <Chip
                          key={idx}
                          label={alt.component.name}
                          size="small"
                          variant="outlined"
                          sx={{ opacity: 0.7 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Cost Estimate */}
      <Accordion
        expanded={expandedPanel === 'cost'}
        onChange={handleAccordionChange('cost')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Cost Estimate
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {suggestions.estimatedCost.monthlyEstimate && (
              <Alert severity="info" icon={<MoneyIcon />}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Estimated Monthly Cost: {suggestions.estimatedCost.monthlyEstimate.currency}{' '}
                  {suggestions.estimatedCost.monthlyEstimate.min.toLocaleString()} -{' '}
                  {suggestions.estimatedCost.monthlyEstimate.max.toLocaleString()}
                </Typography>
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Cost Breakdown:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {suggestions.estimatedCost.breakdown.map((item, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {item.category}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {item.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Implementation Timeline */}
      <Accordion
        expanded={expandedPanel === 'timeline'}
        onChange={handleAccordionChange('timeline')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Implementation Timeline
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" icon={<ScheduleIcon />}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Estimated Total Duration: {suggestions.implementationTimeline.totalWeeks} weeks
              </Typography>
            </Alert>

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Implementation Phases:
            </Typography>
            {suggestions.implementationTimeline.phases.map((phase, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {phase.name}
                  </Typography>
                  <Chip label={`${phase.weeks} weeks`} size="small" color="primary" variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {phase.description}
                </Typography>
                {phase.dependencies.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Dependencies: {phase.dependencies.join(', ')}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Risk Assessment */}
      <Accordion
        expanded={expandedPanel === 'risks'}
        onChange={handleAccordionChange('risks')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Risk Assessment
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity={getRiskColor(suggestions.riskAssessment.overallRisk)}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Overall Risk Level: {suggestions.riskAssessment.overallRisk.toUpperCase()}
              </Typography>
            </Alert>

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Identified Risks:
            </Typography>
            <List>
              {suggestions.riskAssessment.risks.map((risk, index) => (
                <ListItem key={index} sx={{ alignItems: 'flex-start', px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    {getRiskIcon(risk.level)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {risk.description}
                        </Typography>
                        <Chip label={risk.type} size="small" variant="outlined" />
                        <Chip label={`${(risk.probability * 100).toFixed(0)}% likely`} size="small" />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Impact: {risk.impact}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Recommended Mitigations:
            </Typography>
            <List>
              {suggestions.riskAssessment.mitigations.map((mitigation, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {mitigation}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Next Steps */}
      <Paper elevation={2} sx={{ p: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'white' }}>
          <LightbulbIcon />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Next Steps
          </Typography>
        </Box>
        <List sx={{ color: 'white' }}>
          {suggestions.nextSteps.map((step, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
                <CheckIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {step}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

