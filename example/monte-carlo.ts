import parallel from "../src/api/browser";
import {Dictionary} from "lodash";

/* tslint:disable:no-var-requires */
// declare function require(name: string): any;
// const Random = require("simjs-random");
// const random = new Random(10);

export interface IProject {
    startYear: number;
    totalAmount: number;
}

interface IBucket {
    min: number;
    max: number;

    subBuckets: { [groupName: string]: { group: string; min: number, max: number } };
}

interface IGroup {
    /**
     * The unique name of this group
     */
    name: string;

    /**
     * The description of the group
     */
    description: string;

    /**
     * Should a separator line been drawn for this group?
     */
    separator: boolean;

    /**
     * Whats the percentage of values in this group to the total number of simulated values
     */
    percentage: number;

    /**
     * Whats the minimum value that is still part of this group
     */
    from?: number;
    /**
     * Whats the maximum value (exclusive) that defines the upper end of this group
     */
    to?: number;
}

export interface IProjectResult {
    /**
     * The minimal simulated value for this project
     */
    min: number;
    /**
     * The maximal simulated value
     */
    max: number;

    /** The median of the values found for this project
     */
    median: number;

    /**
     * Defines where the 2/3 of the simulated values start / end.
     */
    twoThird: {
        min: number;
        max: number;
    };

    buckets: IBucket[];

    groups: IGroup[];

    /**
     * The project
     */
    project: IProject;
}

interface IMonteCarloEnvironment {
    investmentAmount: number;
    liquidity: number;
    noInterestReferenceLine: number[];
    numRuns: number;
    numYears: number;
    projectsByStartYear: Dictionary<IProject[]>;
    simulatedValues: number[][];
}

export interface IMonteCarloSimulationOptions {
    numYears?: number;
    numRuns?: number;
    projects?: IProject[];
    investmentAmount?: number;
    performance?: number;
    seed?: number;
    volatility: number;
    liquidity?: number;
}

interface IInitializedMonteCarloSimulationOptions {
    numYears: number;
    numRuns: number;
    projects: IProject[];
    investmentAmount: number;
    performance: number;
    seed?: number;
    taskIndex?: number;
    valuesPerWorker?: number;
    liquidity: number;
    volatility: number;
}

function initializeOptions(options?: IMonteCarloSimulationOptions): IInitializedMonteCarloSimulationOptions {
    return Object.assign({}, {
        investmentAmount: 1000000,
        liquidity: 10000,
        numRuns: 10000,
        numYears: 10,
        performance: 0,
        projects: [],
        seed: undefined,
        volatility: 0.01
    }, options);
}

function createMonteCarloEnvironment(options: IInitializedMonteCarloSimulationOptions): IMonteCarloEnvironment {
    /**
     * Performs the monte carlo simulation for all years and num runs.
     * @param cashFlows the cash flows
     * @returns {number[][]} the simulated outcomes grouped by year
     */
    function simulateOutcomes(cashFlows: number[], numYears: number): number[][]  {
        function toAbsoluteIndices(indices: number[]) {
            let currentPortfolioValue = options.investmentAmount;
            let previousYearIndex = 100;

            for (let relativeYear = 0; relativeYear < indices.length; ++relativeYear) {
                const currentYearIndex = indices[relativeYear];
                const cashFlowStartOfYear = relativeYear === 0 ? 0 : cashFlows[relativeYear - 1];

                // scale current value with performance gain according to index
                const performance = currentYearIndex / previousYearIndex;
                currentPortfolioValue = (currentPortfolioValue + cashFlowStartOfYear) * performance;

                indices[relativeYear] = Math.round(currentPortfolioValue);
                previousYearIndex = currentYearIndex;
            }

            return indices;
        }

        const result: number[][] = new Array(options.numYears);
        for (let year = 0; year <= numYears; ++year) {
            result[year] = new Array(options.numRuns);
        }

        for (let run = 0; run < options.numRuns; run++) {
            const indices = [100];

            for (let i = 1; i <= numYears; i++) {
                // const randomPerformance = 1 + random.normal(options.performance, options.volatility);
                const randomPerformance = 1 + Math.random();
                indices.push(indices[i - 1] * randomPerformance);
            }

            // convert the relative values from above to absolute values.
            toAbsoluteIndices(indices);

            for (let year = 0; year < indices.length; ++year) {
                result[year][run] = indices[year];
            }
        }

        return result;
    }

    function projectsToCashFlows() {
        const cashFlows: number[] = [];
        for (let year = 0; year < options.numYears; ++year) {
            const projectsByThisYear = projectsByStartYear[year] || [];
            const cashFlow = -projectsByThisYear.reduce((memo, project) => memo + project.totalAmount, 0);
            cashFlows.push(cashFlow);
        }
        return cashFlows;
    }

    function calculateNoInterestReferenceLine(cashFlows: number[]) {
        const noInterestReferenceLine: number[] = [];

        let investmentAmountLeft = options.investmentAmount;
        for (let year = 0; year < options.numYears; ++year) {
            investmentAmountLeft = investmentAmountLeft + cashFlows[year];
            noInterestReferenceLine.push(investmentAmountLeft);
        }
        return noInterestReferenceLine;
    }

    let projectsToSimulate: IProject[] = options.projects;

    if (options.taskIndex && options.valuesPerWorker) {
        projectsToSimulate = options.projects.slice(options.taskIndex * options.valuesPerWorker, (options.taskIndex + 1) * options.valuesPerWorker);
    }

    const projects = options.projects.sort((a, b) => a.startYear - b.startYear);

    // Group projects by startYear, use lodash groupBy instead
    const projectsByStartYear: Dictionary<IProject[]> = {};
    for (let i = 0; i < projects.length; ++i) {
        const project = projects[i];
        const arr = projectsByStartYear[project.startYear] = projectsByStartYear[project.startYear] || [];
        arr.push(project);
    }

    const cashFlows = projectsToCashFlows();
    const noInterestReferenceLine = calculateNoInterestReferenceLine(cashFlows);

    const numYears = projectsToSimulate.reduce((memo, project) => Math.max(memo, project.startYear), 0);

    return {
        investmentAmount: options.investmentAmount,
        liquidity: options.liquidity,
        noInterestReferenceLine,
        numRuns: options.numRuns,
        numYears,
        projectsByStartYear,
        simulatedValues: simulateOutcomes(cashFlows, numYears)
    };
}

function calculateProject(project: IProject, environment: IMonteCarloEnvironment): IProjectResult {
    const NUMBER_OF_BUCKETS = 10;
    function groupForValue(value: number, groups: IGroup[]): IGroup {
        return groups.find(group => (typeof group.from === "undefined" || group.from <= value) && (typeof group.to === "undefined" || group.to > value))!;
    }

    function createGroups(requiredAmount: number, noInterestReference: number): IGroup[] {
        return [
            { description: "Ziel erreichbar", from: requiredAmount, name: "green", percentage: 0, separator: true},
            { description: "mit Zusatzliquidität erreichbar", from: requiredAmount - environment.liquidity, name: "yellow", percentage: 0, separator: true, to: requiredAmount },
            { description: "nicht erreichbar", from: noInterestReference, name: "gray", percentage: 0, separator: false, to: requiredAmount - environment.liquidity },
            { description: "nicht erreichbar, mit Verlust", name: "red", percentage: 0, separator: false, to: noInterestReference }
        ];
    }

    function calculateRequiredAmount() {
        let amount = project.totalAmount;
        const projectsSameYear = environment.projectsByStartYear[project.startYear];

        for (let i = 0; i < projectsSameYear.length; ++i) {
            const otherProject = projectsSameYear[i];
            if (otherProject === project) {
                break;
            }
            amount += otherProject.totalAmount;
        }
        return amount;
    }

    function median(values: number[]) {
        const half = Math.floor(values.length / 2);

        if (values.length % 2) {
            return values[half];
        }

        return (values[half - 1] + values[half]) / 2.0;
    }

    const requiredAmount = calculateRequiredAmount();
    const simulatedValuesThisYear = environment.simulatedValues[project.startYear];
    simulatedValuesThisYear.sort((a, b) => a - b);

    const groups = createGroups(requiredAmount, environment.noInterestReferenceLine[project.startYear]);
    const valuesByGroup: { [groupName: string]: number } = {};
    const bucketSize = Math.round(simulatedValuesThisYear.length / NUMBER_OF_BUCKETS);
    const buckets: IBucket[] = [];

    for (let i = 0; i < simulatedValuesThisYear.length; i += bucketSize) {
        const bucket: IBucket = {
            max: Number.MIN_VALUE,
            min: Number.MAX_VALUE,
            subBuckets: {}
        };

        for (let j = i; j < i + bucketSize; ++j) {
            const value = simulatedValuesThisYear[j];
            bucket.min = Math.min(bucket.min, value);
            bucket.max = Math.max(bucket.max, value);

            const group = groupForValue(simulatedValuesThisYear[j], groups);
            valuesByGroup[group.name] = (valuesByGroup[group.name] || 0) + 1;
            const subBucket = bucket.subBuckets[group.name] = bucket.subBuckets[group.name] || { group: group.name, max: Number.MIN_VALUE, min: Number.MAX_VALUE };
            subBucket.min = Math.min(subBucket.min, value);
            subBucket.max = Math.max(subBucket.max, value);
        }

        buckets.push(bucket);
    }

    const nonEmptyGroups = groups.filter(group => !!valuesByGroup[group.name]);
    nonEmptyGroups.forEach(group => group.percentage = valuesByGroup[group.name] / simulatedValuesThisYear.length);

    const oneSixth = Math.round(simulatedValuesThisYear.length / 6);
    return {
        buckets,
        groups: nonEmptyGroups,
        max: simulatedValuesThisYear[simulatedValuesThisYear.length - 1],
        median: median(simulatedValuesThisYear),
        min: simulatedValuesThisYear[0],
        project,
        twoThird: {
            max: simulatedValuesThisYear[simulatedValuesThisYear.length - oneSixth],
            min: simulatedValuesThisYear[oneSixth]
        }
    };
}

export function syncMonteCarlo(options?: IMonteCarloSimulationOptions) {
    const environment = createMonteCarloEnvironment(initializeOptions(options));

    let projects: IProjectResult[] = [];
    for (const project of options!.projects!) {
        projects.push(calculateProject(project, environment));
    }

    return projects;
}

export function parallelMonteCarlo(userOptions?: IMonteCarloSimulationOptions) {
    const options = initializeOptions(userOptions);
    return parallel
        .from(options.projects, { minValuesPerTask: 2 })
        .inEnvironment(createMonteCarloEnvironment, options)
        .map(calculateProject);
}
