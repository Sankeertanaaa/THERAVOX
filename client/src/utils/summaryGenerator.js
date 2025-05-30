export const generateSummary = (report) => {
  const emotions = report.emotions || [];
  const pace = report.pace || 0;
  const pitch = report.pitch || 0;
  const silence = report.silence || 0;
  
  // Analyze speech characteristics
  const paceAnalysis = pace < 120 ? "speaking at a slower pace" : 
                      pace > 180 ? "speaking at a faster pace" : 
                      "maintaining a moderate speaking pace";
  
  const pitchAnalysis = pitch < 100 ? "using a lower pitch" :
                       pitch > 200 ? "using a higher pitch" :
                       "using a moderate pitch";
  
  const silenceAnalysis = silence > 2 ? "with noticeable pauses" :
                         silence < 0.5 ? "with minimal pauses" :
                         "with natural pauses";
  
  // Create emotional context
  const emotionalContext = emotions.length > 0 ? 
      `The speech analysis indicates ${emotions.join(', ')} emotions. ` : 
      'The emotional content of the speech was neutral. ';
  
  // Generate comprehensive summary
  const summary = `${emotionalContext}The patient is ${paceAnalysis}, ${pitchAnalysis}, ${silenceAnalysis}. ` +
                 `This combination suggests ${emotions.includes('happy') || emotions.includes('excited') ? 'a positive and engaged' : 
                  emotions.includes('sad') || emotions.includes('angry') ? 'a more intense emotional' : 
                  'a balanced'} communication style. ` +
                 `The speech pattern indicates ${pace < 120 ? 'careful consideration' : 
                  pace > 180 ? 'enthusiasm or urgency' : 
                  'a natural flow'} in communication.`;
  
  return summary;
}; 