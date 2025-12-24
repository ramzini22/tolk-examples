import { Address, toNano } from '@ton/core';
import { FirstContract } from '../wrappers/FirstContract';
import { NetworkProvider } from '@ton/blueprint';

const contractAddress = Address.parse('kQB9P3PL73I2geJnUlX7tajbFlA37KW7M1Y4Hup2IXZ2vqBb');

export async function run(provider: NetworkProvider) {
    const firstContract = provider.open(new FirstContract(contractAddress));
    await firstContract.sendIncrease(provider.sender(), { value: toNano('0.05'), increaseBy: 42 });
    await provider.waitForLastTransaction();
}
