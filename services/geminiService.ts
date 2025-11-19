import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisStatus } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: [AnalysisStatus.Normal, AnalysisStatus.Flashover, AnalysisStatus.Broken, AnalysisStatus.NotAnInsulator],
      description: 'The condition of the object, or if it is not an insulator.'
    },
    objectType: {
      type: Type.STRING,
      description: 'The type of object identified in the image (e.g., "Electrical Insulator", "Cat", "Car"). Provide this in Thai.'
    },
    description: {
      type: Type.STRING,
      description: 'A brief explanation of the finding in Thai.'
    },
    confidenceScores: {
      type: Type.OBJECT,
      description: 'Confidence scores for each insulator status. Only provide if the image is an insulator.',
      properties: {
        normal: { type: Type.NUMBER },
        flashover: { type: Type.NUMBER },
        broken: { type: Type.NUMBER },
      },
      required: ['normal', 'flashover', 'broken']
    }
  },
  required: ['status', 'objectType', 'description']
};

export const analyzeInsulatorImage = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          {
            text: `
              วิเคราะห์ภาพที่ให้มาตามขั้นตอนต่อไปนี้:
              1. ระบุวัตถุหลักในภาพก่อน หากไม่ใช่ "ลูกถ้วยไฟฟ้า" ให้ตั้งค่า 'status' เป็น '${AnalysisStatus.NotAnInsulator}' ระบุชนิดของวัตถุที่พบใน 'objectType' (เช่น 'แมว') และให้คำอธิบายสั้นๆ ใน 'description' (เป็นภาษาไทย) ในกรณีนี้ ไม่ต้องมี 'confidenceScores'
              2. หากวัตถุในภาพคือ "ลูกถ้วยไฟฟ้า" ให้ตั้งค่า 'objectType' เป็น 'ลูกถ้วยไฟฟ้า' จากนั้นให้วิเคราะห์สภาพของมันและตั้งค่า 'status' เป็นหนึ่งใน: '${AnalysisStatus.Normal}', '${AnalysisStatus.Flashover}', หรือ '${AnalysisStatus.Broken}' พร้อมทั้งให้ 'description' ที่สอดคล้องกัน (เป็นภาษาไทย)
              3. สำหรับกรณีที่เป็นลูกถ้วยไฟฟ้าเท่านั้น คุณต้องประเมินเปอร์เซ็นต์ความเชื่อมั่น (0-100) สำหรับแต่ละสถานะที่เป็นไปได้ทั้งหมด ('normal', 'flashover', 'broken') และใส่ไว้ใน object 'confidenceScores'
              
              สำคัญ: ตอบกลับเป็น JSON ที่สอดคล้องกับ schema ที่กำหนดเท่านั้น
            `
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString) as AnalysisResult;

    // Basic validation
    if (Object.values(AnalysisStatus).includes(result.status)) {
        return result;
    } else {
        return {
            status: AnalysisStatus.Unknown,
            description: "AI returned an unrecognized status.",
            objectType: 'Unknown'
        };
    }
  } catch (error) {
    console.error("Error analyzing image with Gemini API:", error);
    let errorMessage = "An unknown error occurred during analysis.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    throw new Error(`Failed to analyze image: ${errorMessage}`);
  }
};
