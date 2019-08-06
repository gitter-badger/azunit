export type AzuTestFunc = (resources: IAzuTest) => void;

export interface IAzuValue {
    disabled(): void;
    enabled(): void;
    equals(value: any): void;
    as(name: string): IAzuValue;
}

export interface IAzuTest {
    selectByProvider(provider: string): IAzuTestable;
    selectByName(name: string): IAzuTestable;
}

export interface IAzuTestable {
    approve(message?: string): void;
    isApproved(): boolean;
    shouldHaveInstanceCount: IAzuValue;
    shouldHaveProperty(selector: string): IAzuValue;
}

export interface IAzuTestContext {
    test(name: string, callback: AzuTestFunc): void;
}

export function test(name: string, callback: AzuTestFunc) {};