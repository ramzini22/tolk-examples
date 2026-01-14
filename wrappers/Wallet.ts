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

const WALLET_ADDRESS = process.env.WALLET_ADDRESS ?? '';
export const contractCustomAddress = Address.parse(WALLET_ADDRESS);

export type WalletConfig = {
    publicKey: Buffer;
    subwallet_id?: number;
};

export function walletConfigToCell(config: WalletConfig): Cell {
    const pubkey = BigInt('0x' + config.publicKey.toString('hex'));
    const subwallet_id = config.subwallet_id ?? 0;
    return beginCell().storeUint(subwallet_id, 32).storeUint(0, 32).storeUint(pubkey, 256).endCell();
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
