export interface Intent {
  type?: string;
  complexity?: string;
  confidence?: number;
  [key: string]: any;
}

interface OptimizedPromptResult {
  original: string;
  optimized: string;
  enhancements: string[];
}

export class PromptOptimizer {
  optimize(prompt: string, intent?: Intent | string): OptimizedPromptResult {
    const enhancements: string[] = [];
    let optimized = prompt.trim();

    // Add context if missing
    if (!this.hasContext(prompt)) {
      optimized = `Please provide a detailed response: ${optimized}`;
      enhancements.push('Added context');
    }

    // Add format preference if code-related
    if (this.isCodeRelated(prompt)) {
      if (!optimized.includes('format') && !optimized.includes('code block')) {
        optimized = `${optimized}\n\nPlease format with proper code blocks.`;
        enhancements.push('Added code formatting');
      }
    }

    // Add structure for analysis
    if (this.isAnalysisRequest(prompt)) {
      if (!optimized.includes('structure')) {
        optimized = `${optimized}\n\nStructure response clearly.`;
        enhancements.push('Added structure');
      }
    }

    return {
      original: prompt,
      optimized,
      enhancements
    };
  }

  private hasContext(prompt: string): boolean {
    return prompt.length >= 20 && prompt.split(' ').length > 5;
  }

  private isCodeRelated(prompt: string): boolean {
    const keywords = ['code', 'function', 'algorithm', 'debug', 'javascript', 'python'];
    return keywords.some(kw => prompt.toLowerCase().includes(kw));
  }

  private isAnalysisRequest(prompt: string): boolean {
    const keywords = ['analyze', 'explain', 'compare', 'evaluate'];
    return keywords.some(kw => prompt.toLowerCase().includes(kw));
  }
}
