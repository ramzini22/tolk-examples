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

export const contractCustomAddress = Address.parse('kQCB9z2s7anGgJIYelXxP_dGm-7Do_-Vq98rqz0WDNrs69fp');

export type WalletConfig = {
    publicKey: Buffer;
};

export function walletConfigToCell(config: WalletConfig): Cell {
    const pubkey = BigInt('0x' + config.publicKey.toString('hex'));
    return beginCell().storeUint(0, 32).storeUint(pubkey, 256).endCell();
}

export class WalletContract implements Contract {
    abi: ContractABI = { name: 'Wallet' };

    static createFromAddress(address: Address) {
        return new WalletContract(address);
    }

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromConfig(config: WalletConfig, code: Cell, workchain = 0): WalletContract {
        const data = walletConfigToCell(config);
        const init = { code, data };
        return new WalletContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getSeqno(provider: ContractProvider) {
        const result = await provider.get('getSeqno', []);
        return result.stack.readNumber();
    }

    async getPublicKey(provider: ContractProvider) {
        const result = await provider.get('getPublicKey', []);
        return result.stack.readBigNumber();
    }
}
