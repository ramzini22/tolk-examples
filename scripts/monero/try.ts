import { WalletContract } from './contracts/wallet.contract';
import { BlockchainUtils } from '../../blockchain/utils/blockchain.utils';

export async function run(provider: unknown) {
    await new Promise((r) => {
        setTimeout(r, 3000);
    });

    const user1Password = 'user1Password';
    const user2Password = 'user2Password';
    const stateInit1 = { code: WalletContract.toString(), data: { password: user1Password } };
    const stateInit2 = { code: WalletContract.toString(), data: { password: user2Password } };

    const address1 = BlockchainUtils.getAddress(stateInit1);
    const address2 = BlockchainUtils.getAddress(stateInit2);

    BlockchainUtils.createUninitializedContract(address1, 53);

    BlockchainUtils.sendMoney({
        address: address1,
        stateInit: stateInit1,
        body: { password: user1Password, amount: 11, to: address2, body: { wer: 213 } },
    });

    await new Promise(() => {});
}
