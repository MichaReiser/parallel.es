import parallel from "../src/browser/index";
import {IParallelOptions} from "../src/common/parallel/parallel-options";

export interface ICoordinate {
    readonly x: number;
    readonly y: number;
}

type IPath = ICoordinate[];

export interface IKnightTourEnvironment {
    boardSize: number;
    board: number[];
}

function createEnvironment({ boardSize }: { boardSize: number }): IKnightTourEnvironment {
    const board: number[] = new Array(boardSize * boardSize);
    board.fill(0);
    return {
        board,
        boardSize
    };
}

export function knightTours(start: ICoordinate, { board, boardSize }: IKnightTourEnvironment): number {
    const moves = [
        { x: -2, y: -1 }, { x: -2, y: 1}, { x: -1, y: -2 }, { x: -1, y: 2 },
        { x: 1, y: -2 }, { x: 1, y: 2}, { x: 2, y: -1 }, { x: 2, y: 1 }
    ];
    const numberOfFields = boardSize * boardSize;

    let results: number = 0;
    const stack: { coordinate: ICoordinate, n: number }[] = [ { coordinate: start, n : 1 }];

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

export function syncKnightTours(boardSize: number): number {
    const environment = createEnvironment({ boardSize });
    let numberOfSolutions = 0;

    for (let x = 0; x < environment.boardSize; ++x) {
        for (let y = 0; y < environment.boardSize; ++y) {
            numberOfSolutions += knightTours({ x, y }, environment);
        }
    }

    return numberOfSolutions;
}

export function parallelKnightTours(boardSize: number, options?: IParallelOptions): PromiseLike<number> {
    return parallel
        .range(0, boardSize * boardSize, 1, options)
        .environment({ boardSize })
        .initializer(createEnvironment)
        .map((index, env) => { return { x: Math.floor(index / env.boardSize), y: index % env.boardSize }; })
        .map(knightTours)
        .reduce(0, (memo, count) => memo + count);
}

export function formatPath(path: IPath) {
    return path.map(coordiante => `(${coordiante.x}, ${coordiante.y})`).join("->");
}

export function validatePath(path: IPath) {
    const boardSize = Math.sqrt(path.length);
    const foundCoordinates: boolean[] = new Array<boolean>(path.length);
    foundCoordinates.fill(false);

    for (let i = 0; i < path.length; ++i) {
        const coordinate = path[i];
        const position = coordinate.x * boardSize + coordinate.y;

        if (foundCoordinates[position] === true) {
            throw new Error(`The coordinate ${coordinate.x}, ${coordinate.y} ocuurres twice in the same path`);
        }
        foundCoordinates[position] = true;
    }

    for (let i = 0; i < foundCoordinates.length; ++i) {
        if (!foundCoordinates[i]) {
            throw new Error(`The coordinate ${Math.floor(i / boardSize)}, ${i % boardSize} is not part of the path`);
        }
    }
}
