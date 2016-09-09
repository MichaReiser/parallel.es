export interface IEmptyParallelEnvironment {
    [name: string]: any;
}

export interface IParallelTaskEnvironment extends IEmptyParallelEnvironment{
    /**
     * The parallel chain specific task id
     */
    taskIndex: number;
}
