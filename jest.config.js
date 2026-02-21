module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
  moduleNameMapper: {
    // Mocks para Obsidian y assets
    '^obsidian$': '<rootDir>/src/test/mocks/obsidian.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mock para Recharts (necesario para que no fallen los gráficos en los tests)
    'recharts': '<rootDir>/src/test/mocks/recharts.ts',
    // Mock para Google AI (ESM module que Jest no transpila por defecto)
    '^@google/genai$': '<rootDir>/src/test/mocks/google-genai.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  }
};
