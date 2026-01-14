import { compile, NetworkProvider } from '@ton/blueprint';
import { WalletContract } from '../../wrappers/wallet/Wallet';
import { toNano } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const wallet_id = Number(process.env.WALLET_ID ?? 0);
    const words = ['1', '2', '3'];
    const { publicKey } = await mnemonicToPrivateKey(words);

    const walletContract = provider.open(
        WalletContract.createFromConfig({ publicKey, wallet_id }, await compile('wallet/Wallet')),
    );

    await walletContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(walletContract.address);
}
