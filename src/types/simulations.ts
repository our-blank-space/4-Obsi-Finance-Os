
export type ScenarioType = 'passive' | 'livestock' | 'agriculture' | 'custom';

export interface Scenario {
    id: string;
    name: string;
    type: ScenarioType;
    variables: Record<string, number>;
    timeHorizon: number;
    createdAt: string;
}

export interface ProjectionParams {
    years: number;
    expectedReturn: number;
    inflationRate: number;
}
