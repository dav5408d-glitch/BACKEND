export interface Intent {
  domain: string;
  complexity: 'low' | 'medium' | 'high';
  type: string;
  needsCode: boolean;
  needsVision: boolean;
  language?: string;
}

export class IntentAnalyzer {
  private codeKeywords = [
    'code', 'program', 'function', 'bug', 'error', 'debug',
    'javascript', 'python', 'java', 'html', 'css', 'react',
    'node', 'sql', 'api', 'git', 'algorithm', 'loop', 'variable'
  ];

  private scienceKeywords = [
    'explain', 'what is', 'how does', 'why', 'science',
    'physics', 'chemistry', 'biology', 'math', 'calculate',
    'theory', 'concept', 'principle'
  ];

  private creativeKeywords = [
    'write', 'create', 'story', 'poem', 'song', 'script',
    'invent', 'imagine', 'describe', 'narrative', 'fiction'
  ];

  private analysisKeywords = [
    'analyze', 'compare', 'evaluate', 'critique', 'review',
    'discuss', 'interpret', 'assess', 'judge'
  ];

  async analyze(text: string): Promise<Intent> {
    const lowerText = text.toLowerCase();
    
    // Détection de domaine
    let domain = 'general';
    if (this.containsAny(lowerText, this.codeKeywords)) domain = 'code';
    else if (this.containsAny(lowerText, this.scienceKeywords)) domain = 'science';
    else if (this.containsAny(lowerText, this.creativeKeywords)) domain = 'creative';
    else if (this.containsAny(lowerText, this.analysisKeywords)) domain = 'analysis';

    // Détection de complexité
    const complexity = this.analyzeComplexity(text);

    // Détection langage de programmation
    const language = this.detectProgrammingLanguage(text);

    return {
      domain,
      complexity,
      type: this.detectType(text),
      needsCode: domain === 'code',
      needsVision: false, // À détecter via upload d'image
      language
    };
  }

  private analyzeComplexity(text: string): 'low' | 'medium' | 'high' {
    const words = text.split(' ');
    
    if (words.length < 5) return 'low';
    if (words.length > 20) return 'high';
    
    // Vérifier les mots complexes
    const complexWords = ['complex', 'advanced', 'detailed', 'comprehensive', 'in-depth'];
    const hasComplexWords = complexWords.some(word => 
      text.toLowerCase().includes(word)
    );
    
    return hasComplexWords ? 'high' : 'medium';
  }

  private detectType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('?')) return 'question';
    if (lowerText.startsWith('explain')) return 'explanation';
    if (lowerText.startsWith('write') || lowerText.startsWith('create')) return 'creation';
    if (lowerText.includes('compare') || lowerText.includes('vs')) return 'comparison';
    if (lowerText.includes('how to')) return 'tutorial';
    
    return 'general';
  }

  private detectProgrammingLanguage(text: string): string | undefined {
    const languages = {
      javascript: ['javascript', 'js', 'node', 'react'],
      python: ['python', 'py'],
      java: ['java'],
      html: ['html'],
      css: ['css'],
      typescript: ['typescript', 'ts'],
      sql: ['sql', 'database']
    };

    for (const [lang, keywords] of Object.entries(languages)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return lang;
      }
    }

    return undefined;
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}