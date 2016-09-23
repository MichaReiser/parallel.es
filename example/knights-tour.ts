import parallel from "../src/browser/index";
import {IParallelOptions} from "../src/common/parallel/parallel-options";

export interface ICoordinate {
    readonly x: number;
    readonly y: number;
}

export interface IKnightTourEnvironment {
    boardSize: number;
    board: number[];
}

function createEnvironment(boardSize: number): IKnightTourEnvironment {
    const board: number[] = new Array(boardSize * boardSize);
    board.fill(0);
    return {
        board,
        boardSize
    };
}

export function knightTours(startPath: ICoordinate[], environment: IKnightTourEnvironment): number {
    const moves = [
        { x: -2, y: -1 }, { x: -2, y: 1}, { x: -1, y: -2 }, { x: -1, y: 2 },
        { x: 1, y: -2 }, { x: 1, y: 2}, { x: 2, y: -1 }, { x: 2, y: 1 }
    ];
    const boardSize = environment.boardSize;
    const board = environment.board;
    const numberOfFields = boardSize * boardSize;
    let results: number = 0;
    const stack: { coordinate: ICoordinate, n: number }[] = startPath.map((pos, index) => ({ coordinate: pos, n: index + 1 }));

    for (let index = 0; index < startPath.length - 1; ++index) {
        const fieldIndex = startPath[index].x * boardSize + startPath[index].y;
        board[fieldIndex] = index + 1;
    }

    while (stack.length > 0) {
        const { coordinate, n } = stack[stack.length - 1];
        const fieldIndex = coordinate.x * boardSize + coordinate.y;

        if (board[fieldIndex] !== 0) {
            // back tracking
            board[fieldIndex] = 0;
            stack.pop(); // remove current value
            continue;
        }

        // entry
        if (n === numberOfFields) {
            ++results;
            stack.pop();
            continue;
        }

        board[fieldIndex] = n!;

        for (let i = 0; i < moves.length; ++i) {
            const move = moves[i];
            const successor = { x: coordinate.x + move.x, y: coordinate.y + move.y };
            // not outside of board and not yet accessed
            const accessible = successor.x >= 0 && successor.y >= 0 && successor.x < boardSize &&  successor.y < boardSize && board[successor.x * boardSize + successor.y] === 0;

            if (accessible) {
                stack.push({ coordinate: successor, n: n + 1 });
            }
        }
    }

    return results;
}

export function syncKnightTours(start: ICoordinate, boardSize: number): number {
    const environment = createEnvironment(boardSize);
    return knightTours([start], environment);
}

export function parallelKnightTours(start: ICoordinate, boardSize: number, options?: IParallelOptions): PromiseLike<number> {

    function successors(coordinate: ICoordinate) {
        const moves = [
            {x: -2, y: -1}, {x: -2, y: 1}, {x: -1, y: -2}, {x: -1, y: 2},
            {x: 1, y: -2}, {x: 1, y: 2}, {x: 2, y: -1}, {x: 2, y: 1}
        ];
        const result: ICoordinate[] = [];

        for (const move of moves) {
            const successor = {x: coordinate.x + move.x, y: coordinate.y + move.y};
            const accessible = successor.x >= 0 && successor.y >= 0 && successor.x < boardSize && successor.y < boardSize &&
                (successor.x !== start.x || successor.y !== start.y) && (successor.x !== coordinate.x && successor.y !== coordinate.y);
            if (accessible) {
                result.push(successor);
            }
        }

        return result;
    }

    function computeStartFields() {
        const result: ICoordinate[][] = [];
        for (const directSuccessor of successors(start)) {
            for (const indirectSuccessor of successors(directSuccessor)) {
                result.push([start, directSuccessor, indirectSuccessor]);
            }
        }
        return result;
    }

    let total = 0;
    let startTime = performance.now();
    return parallel
        .from(computeStartFields(), options)
        .inEnvironment(createEnvironment, boardSize)
        .map(knightTours)
        .reduce(0, (memo, count) => memo + count)
        .subscribe(subResults => {
            for (const tours of subResults) {
                total += tours;
            }
            /* tslint:disable:no-console */
            console.log(`${total / (performance.now() - startTime) * 1000} results per second`);
        });
}
