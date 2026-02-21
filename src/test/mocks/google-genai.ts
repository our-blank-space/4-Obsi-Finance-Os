export class GoogleGenAI {
    constructor(apiKey: string) { }
    getGenerativeModel() {
        return {
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () => "AI Response Mock"
                }
            })
        };
    }
}
