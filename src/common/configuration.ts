import {IThreadPool} from "./thread-pool/thread-pool";
import {FunctionRegistry} from "./serialization/function-registry";

export interface IConfiguration {
    threadPool: IThreadPool;
    functionLookupTable: FunctionRegistry;
    maxConcurrencyLevel: number;
}