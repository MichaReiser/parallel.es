import {ITaskDefinition} from "../task/task-definition";

export interface IParallelTaskDefinition extends ITaskDefinition {
    valuesPerWorker: number;
    taskIndex: number;
}
