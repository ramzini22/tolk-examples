import {
    Address,
    beginCell,
    Cell,
    Contract,
    ContractABI,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
} from '@ton/core';

export type FirstContractConfig = {};

export function firstContractConfigToCell(config: FirstContractConfig): Cell {
    return beginCell().endCell();
}

export class FirstContract implements Contract {
    abi: ContractABI = { name: 'FirstContract' };

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new FirstContract(address);
    }

    static createFromConfig(config: FirstContractConfig, code: Cell, workchain = 0) {
        const data = firstContractConfigToCell(config);
        const init = { code, data };
        return new FirstContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrease(
        provider: ContractProvider,
        via: Sender,
        opts: {
            increaseBy: number;
            value: bigint;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x7e8764ef, 32).storeUint(opts.increaseBy, 32).endCell(),
        });
    }

    async sendReset(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x3a752f06, 32).endCell(),
        });
    }

    async getCounter(provider: ContractProvider) {
        const result = await provider.get('currentCounter', []);
        return result.stack.readNumber();
    }

    async getFullStorage(provider: ContractProvider) {
        const state = await provider.getState();

        if (!state || state.state.type !== 'active' || !state.state.data) {
            throw new Error('No data');
        }

        // data — это Buffer, а не Cell
        const cell = Cell.fromBoc(state.state.data)[0];

        const slice = cell.beginParse();

        console.log(slice);

        return {
            counter: slice.loadInt(64),
        };
    }
}
