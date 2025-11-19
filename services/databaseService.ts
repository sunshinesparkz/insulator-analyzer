import { supabase } from './supabaseClient';
import { AnalysisResult } from '../types';

export interface InspectionRecord {
  status: string;
  object_type: string;
  description: string;
  confidence_scores: any;
}

export const saveInspectionResult = async (result: AnalysisResult): Promise<void> => {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping save.');
    return;
  }

  try {
    const record: InspectionRecord = {
      status: result.status,
      object_type: result.objectType,
      description: result.description,
      confidence_scores: result.confidenceScores || null,
    };

    const { error } = await supabase
      .from('inspections')
      .insert([record]);

    if (error) {
      throw error;
    }

    console.log('Inspection result saved to Supabase successfully.');
  } catch (error) {
    console.error('Error saving inspection to Supabase:', error);
    // We purposefully do not throw here to prevent blocking the UI flow
    // if the database logging fails.
  }
};
