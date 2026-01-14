import { compile, NetworkProvider } from '@ton/blueprint';
import { contractAddress } from '@ton/core';
import { walletConfigToCell } from '../../wrappers/wallet/Wallet';
import { mnemonicToPrivateKey } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const wallet_id = Number(process.env.WALLET_ID ?? 0);
    const words = ['1', '2', '3'];
    const { publicKey } = await mnemonicToPrivateKey(words);

    const codeCell = await compile('wallet/Wallet');
    const dataCell = walletConfigToCell({ publicKey, wallet_id });
    const walletAddress = contractAddress(0, { code: codeCell, data: dataCell });
    console.log(walletAddress.toString({ testOnly: true }));
}
