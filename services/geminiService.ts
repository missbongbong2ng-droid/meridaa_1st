
import { GoogleGenAI } from "@google/genai";
import { CompanyInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIPersonnalizedGreeting = async (company: CompanyInfo, candidateName: string = "지원자님") => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 ${company.name}의 채용 담당자입니다. ${company.jobTitle} 직무에 지원한 ${candidateName}님에게 면접 안내를 위한 따뜻하고 전문적인 환영 인사말을 3문장 이내로 작성해 주세요.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "환영합니다! 면접 시간을 선택해 주세요.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "안녕하세요! 지원해 주셔서 감사합니다. 원하시는 면접 시간을 선택해 주세요.";
  }
};
