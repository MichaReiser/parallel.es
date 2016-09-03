import {ThreadPool} from "./thread-pool/thread-pool";
import {FunctionRegistry} from "./serialization/function-registry";

export interface Configuration {
    threadPool: ThreadPool;
    functionLookupTable: FunctionRegistry;
    maxConcurrencyLevel: number;
}