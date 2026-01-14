import { NetworkProvider } from '@ton/blueprint';
import { contractCustomAddress, WalletContract } from '../../wrappers/wallet/Wallet';

export async function run(provider: NetworkProvider) {
    const wallet = provider.open(new WalletContract(contractCustomAddress));
    const publicKey = await wallet.getPublicKey();
    console.log('PublicKey: ', publicKey);
}
