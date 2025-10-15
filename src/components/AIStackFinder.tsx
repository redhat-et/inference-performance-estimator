import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  AutoAwesome as MagicIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { ProjectRequirements, AIStackSuggestion } from '../types/stackFinder';
import { DEFAULT_PROJECT_REQUIREMENTS } from '../types/stackFinder';
import { generateStackRecommendations } from '../utils/stackRecommendation';
import { StackFinderForm } from './StackFinderForm';
import { StackRecommendations } from './StackRecommendations';

export const AIStackFinder: React.FC = () => {
  const [requirements, setRequirements] = useState<ProjectRequirements>(DEFAULT_PROJECT_REQUIREMENTS);
  const [suggestions, setSuggestions] = useState<AIStackSuggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequirementsChange = (newRequirements: ProjectRequirements) => {
    setRequirements(newRequirements);
    // Clear previous results when requirements change significantly
    if (suggestions) {
      setSuggestions(null);
    }
    setError(null);
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newSuggestions = generateStackRecommendations(requirements);
      setSuggestions(newSuggestions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      console.error('Error generating recommendations:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', py: 2, mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            AI Stack Finder
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: '800px', mx: 'auto' }}
          >
            Get personalized AI technology stack recommendations based on your project requirements.
            Our intelligent system analyzes your needs and suggests the best tools, frameworks, and services
            to build your AI solution efficiently and effectively.
          </Typography>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Recommendation Generation Failed
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              💡 Please try again or adjust your requirements.
            </Typography>
          </Alert>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 4,
            mb: 3
          }}>
            <CircularProgress size={60} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Generating AI Stack Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analyzing your requirements and matching with optimal technologies...
              </Typography>
            </Box>
          </Box>
        )}

        {/* Main Content */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', xl: 'row' },
          gap: 3,
          minHeight: '60vh'
        }}>
          {/* Form Section */}
          <Box sx={{
            flex: suggestions ? { xs: 1, xl: '0 0 400px' } : 1,
            minWidth: 0
          }}>
            <StackFinderForm
              onRequirementsChange={handleRequirementsChange}
              onGenerateRecommendations={handleGenerateRecommendations}
              isGenerating={isGenerating}
            />
          </Box>

          {/* Results Section */}
          {suggestions && !isGenerating && (
            <Fade in={true} timeout={500}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <StackRecommendations suggestions={suggestions} />
              </Box>
            </Fade>
          )}

          {/* Empty State */}
          {!suggestions && !isGenerating && !error && (
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              py: 8,
              color: 'text.secondary'
            }}>
              <MagicIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.7 }}>
                Ready to Find Your Perfect AI Stack?
              </Typography>
              <Typography variant="body2" sx={{ maxWidth: 400, opacity: 0.6 }}>
                Complete the form on the left with your project requirements,
                and we'll generate personalized technology recommendations for your AI project.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer Information */}
        <Box sx={{ textAlign: 'center', py: 3, mt: 4, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>AI Stack Finder</strong> uses intelligent matching algorithms to recommend
            technologies based on your specific requirements, constraints, and preferences.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Recommendations are based on current industry best practices, community feedback,
            and compatibility analysis. Always validate recommendations against your specific use case.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

