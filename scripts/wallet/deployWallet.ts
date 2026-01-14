import { compile, NetworkProvider } from '@ton/blueprint';
import { WalletContract } from '../../wrappers/Wallet';
import { toNano } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const subwallet_id = Number(process.env.SUBWALLET_ID ?? 0);
    const words = ['1', '2', '3'];
    const { publicKey } = await mnemonicToPrivateKey(words);

    const walletContract = provider.open(
        WalletContract.createFromConfig({ publicKey, subwallet_id }, await compile('Wallet')),
    );

    await walletContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(walletContract.address);
}
