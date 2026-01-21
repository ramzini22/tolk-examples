import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { compile } from '@ton/blueprint';

export type JettonWalletConfig = {
    seller: Address;
    bayer: Address;
    arbitrator: Address;
    amount: bigint;
    dealHash: string;
};

export enum DealContractStatus {
    Created = 0,
}

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
    const hashBigInt = BigInt('0x' + config.dealHash);

    const deal = beginCell()
        .storeUint(hashBigInt, 256)
        .storeUint(DealContractStatus.Created, 32)
        .storeCoins(config.amount)
        .endCell();

    return beginCell()
        .storeAddress(config.seller)
        .storeAddress(config.bayer)
        .storeAddress(config.arbitrator)
        .storeRef(deal)
        .endCell();
}

export class DenContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    public static async createFromConfig(config: JettonWalletConfig, workchain = 0) {
        const code: Cell = await compile('den-contract');

        const data = jettonWalletConfigToCell(config);
        const init = { code, data };
        return new DenContract(contractAddress(workchain, init), init);
    }

    public async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    public async getDealStorage(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type !== 'active') {
            return 0n;
        }
        let res = await provider.get('getDealStorage', []);
        const stack = res.stack;
        const hashBigInt = stack.readBigNumber();
        const status = stack.readNumber();
        const amount = stack.readBigNumber();

        const dealHash = hashBigInt.toString(16);

        return {
            dealHash,
            amount,
            status,
        };
    }

    public async getContractStorage(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type !== 'active') {
            return 0n;
        }
        let res = await provider.get('getContractStorage', []);
        const stack = res.stack;
        const seller = stack.readAddress();
        const bayer = stack.readAddress();
        const arbitrator = stack.readAddress();

        return {
            seller,
            bayer,
            arbitrator,
        };
    }
}
