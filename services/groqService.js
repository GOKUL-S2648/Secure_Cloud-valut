import { apiFetch } from './api';

export class GroqService {
    async analyzeFile(fileName, fileType) {
        try {
            const response = await apiFetch('/api/analyze', {
                method: 'POST',
                body: JSON.stringify({ fileName, fileType })
            });
            return await response.json();
        } catch (error) {
            console.error("Backend analysis error:", error);
            return {
                verdict: "Security scan unavailable.",
                category: "Other",
                riskLevel: "Low"
            };
        }
    }

    async analyzeFileSecurity(fileName, fileType) {
        const analysis = await this.analyzeFile(fileName, fileType);
        return analysis.verdict;
    }
}

export const groqService = new GroqService();
